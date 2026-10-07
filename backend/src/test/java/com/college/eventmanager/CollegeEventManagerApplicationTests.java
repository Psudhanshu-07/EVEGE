package com.college.eventmanager;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Boots the real Spring context (H2 in tests only) and drives the required flow:
 * seed dummy events (Sports/Cultural/Techfest, Rs.100) -> stats -> register with
 * transaction ref -> list registrations -> JWT login.
 */
@SpringBootTest
@AutoConfigureMockMvc
class CollegeEventManagerApplicationTests {

    @Autowired private MockMvc mvc;
    private final ObjectMapper om = new ObjectMapper();

    @Test
    void seedsThreeCategoriesAt100AndCapturesRegistrations() throws Exception {
        // GET /api/events seeds the dummy set on an empty DB
        MvcResult eventsResult = mvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode events = om.readTree(eventsResult.getResponse().getContentAsString());

        assertThat(events.size()).isGreaterThanOrEqualTo(9);

        // Every event costs exactly Rs.100 and carries its festival tag
        long techfest = 0, cultural = 0, sports = 0;
        for (JsonNode e : events) {
            assertThat(e.get("registrationFee").asDouble()).isEqualTo(100.00);
            String category = e.get("category").asText();
            String title = e.get("title").asText();
            if ("Techfest".equals(category)) {
                techfest++;
                assertThat(title).contains("[Srujanam]");
            } else if ("Cultural".equals(category)) {
                cultural++;
                assertThat(title).contains("[Naad]");
            } else if ("Sports".equals(category)) {
                sports++;
                assertThat(title).contains("[Naad]");
            }
        }
        assertThat(techfest).isGreaterThanOrEqualTo(1);
        assertThat(cultural).isGreaterThanOrEqualTo(1);
        assertThat(sports).isGreaterThanOrEqualTo(1);

        // Stats expose the four dashboard metrics
        mvc.perform(get("/api/events/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEvents").value(events.size()))
                .andExpect(jsonPath("$.totalRegistrations").value(0))
                .andExpect(jsonPath("$.totalCollectedFees").value(0.0))
                .andExpect(jsonPath("$.festTracks").value(3));

        // A second GET must not re-seed
        MvcResult again = mvc.perform(get("/api/events")).andReturn();
        assertThat(om.readTree(again.getResponse().getContentAsString()).size())
                .isEqualTo(events.size());

        long eventId = events.get(0).get("id").asLong();

        // POST /api/registrations links the event and persists the transaction ref
        String regBody = """
            {"studentName":"Asha Rao","studentEmail":"asha@college.edu","collegeId":"23CS101",
             "eventId":%d,"transactionRef":"324109823412","paymentStatus":"PAID"}
            """.formatted(eventId);

        mvc.perform(post("/api/registrations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.eventTitle").value(events.get(0).get("title").asText()))
                .andExpect(jsonPath("$.eventId").value(eventId))
                .andExpect(jsonPath("$.transactionRef").value("324109823412"))
                .andExpect(jsonPath("$.paymentStatus").value("PAID"));

        // GET /api/registrations returns it
        MvcResult regs = mvc.perform(get("/api/registrations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].studentName").value("Asha Rao"))
                .andReturn();
        assertThat(om.readTree(regs.getResponse().getContentAsString()).size()).isEqualTo(1);

        // Stats now reflect the paid registration
        mvc.perform(get("/api/events/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRegistrations").value(1))
                .andExpect(jsonPath("$.totalCollectedFees").value(100.0));

        // Unknown event -> 400
        mvc.perform(post("/api/registrations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentName\":\"X\",\"eventId\":99999}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registrationPersistsProfileAndLoginIssuesJwt() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"fullName":"Asha Rao","email":"asha@gmail.com","phone":"+91 9876543210",
                             "college":"EVEGE College","branch":"Computer Science","rollNumber":"23CS101",
                             "yearSemester":"3rd Year","gender":"Female","password":"secret123",
                             "confirmPassword":"secret123","role":"STUDENT"}
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("asha@gmail.com"))
                .andExpect(jsonPath("$.role").value("STUDENT"));

        mvc.perform(get("/api/auth/students"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.email == 'asha@gmail.com')][0].fullName").value("Asha Rao"))
                .andExpect(jsonPath("$[?(@.email == 'asha@gmail.com')][0].phone").value("+91 9876543210"))
                .andExpect(jsonPath("$[?(@.email == 'asha@gmail.com')].password").doesNotExist());
    }

    @Test
    void loginIssuesJwtAndRejectsBadCredentials() throws Exception {
        MvcResult ok = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"demoadmin@gmail.com\",\"password\":\"123321\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        String token = om.readTree(ok.getResponse().getContentAsString()).get("token").asText();
        assertThat(jwtUsername(token)).isEqualTo("demoadmin@gmail.com");

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"demoadmin@gmail.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
    }

    private String jwtUsername(String token) throws Exception {
        String[] parts = token.split("\\.");
        String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
        return om.readTree(payload).path("sub").asText();
    }
}
