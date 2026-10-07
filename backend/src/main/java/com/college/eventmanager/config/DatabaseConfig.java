package com.college.eventmanager.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Bean
    @Primary
    public DataSource dataSource() {
        // Render provides DATABASE_URL or SPRING_DATASOURCE_URL
        String rawUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = System.getenv("DATABASE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = System.getProperty("spring.datasource.url");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = "jdbc:postgresql://localhost:5432/evege_db";
        }

        rawUrl = rawUrl.trim();
        log.info("Configuring DataSource. Raw URL prefix: {}", rawUrl.length() > 15 ? rawUrl.substring(0, 15) : rawUrl);

        HikariConfig config = new HikariConfig();

        // Check if the URL is in Render/Heroku standard URI format (postgres://user:pass@host:port/db or postgresql://...)
        if (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://")) {
            try {
                // Replace postgres:// with http:// temporarily to parse standard URI safely
                String uriString = rawUrl.replaceFirst("^postgres(ql)?://", "http://");
                URI uri = new URI(uriString);

                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath() != null && uri.getPath().length() > 1 ? uri.getPath().substring(1) : "evege_db";

                String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + path;
                config.setJdbcUrl(jdbcUrl);

                if (uri.getUserInfo() != null) {
                    String[] userParts = uri.getUserInfo().split(":", 2);
                    config.setUsername(userParts[0]);
                    if (userParts.length > 1) {
                        config.setPassword(userParts[1]);
                    }
                }

                log.info("Successfully parsed Render PostgreSQL URI to JDBC URL: jdbc:postgresql://{}:{}/{}", host, port, path);
            } catch (Exception e) {
                log.warn("Failed to parse PostgreSQL URI, falling back to direct string prepending: {}", e.getMessage());
                config.setJdbcUrl(rawUrl.startsWith("jdbc:") ? rawUrl : "jdbc:" + rawUrl);
                applyCredentialsFromEnv(config);
            }
        } else {
            // Standard JDBC URL (e.g. jdbc:postgresql://localhost:5432/evege_db)
            config.setJdbcUrl(rawUrl);
            applyCredentialsFromEnv(config);
        }

        config.setDriverClassName("org.postgresql.Driver");
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);

        return new HikariDataSource(config);
    }

    private void applyCredentialsFromEnv(HikariConfig config) {
        String username = System.getenv("SPRING_DATASOURCE_USERNAME");
        if (username == null || username.isBlank()) {
            username = System.getenv("PGUSER");
        }
        if (username == null || username.isBlank()) {
            username = "postgres";
        }

        String password = System.getenv("SPRING_DATASOURCE_PASSWORD");
        if (password == null || password.isBlank()) {
            password = System.getenv("PGPASSWORD");
        }
        if (password == null || password.isBlank()) {
            password = "PandeyS";
        }

        config.setUsername(username);
        config.setPassword(password);
    }
}
