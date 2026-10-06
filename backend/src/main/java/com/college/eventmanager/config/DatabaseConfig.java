package com.college.eventmanager.config;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Configuration;

import java.net.URI;

@Configuration
public class DatabaseConfig {

    private final DataSourceProperties properties;

    public DatabaseConfig(DataSourceProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    public void normalizeDatabaseUrl() {
        String envDbUrl = System.getenv("DATABASE_URL");
        String targetUrl = properties.getUrl();

        // If system env DATABASE_URL is set (e.g. Render PostgreSQL), use it if needed
        if ((targetUrl == null || targetUrl.isBlank() || targetUrl.contains("localhost:5433")) && envDbUrl != null && !envDbUrl.isBlank()) {
            targetUrl = envDbUrl;
        }

        if (targetUrl != null && (targetUrl.startsWith("postgres://") || targetUrl.startsWith("postgresql://"))) {
            try {
                URI uri = new URI(targetUrl);
                String userInfo = uri.getUserInfo();
                if (userInfo != null) {
                    String[] parts = userInfo.split(":");
                    properties.setUsername(parts[0]);
                    if (parts.length > 1) {
                        properties.setPassword(parts[1]);
                    }
                }
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();
                String host = uri.getHost();
                String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
                properties.setUrl(jdbcUrl);
            } catch (Exception ignored) {
            }
        }
    }
}

