package soqe.libro.server;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.MockMvcAutoConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class CrossCuttingConcernsTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private soqe.libro.server.filter.RequestIdFilter requestIdFilter;

    @Autowired
    private soqe.libro.server.filter.RateLimitFilter rateLimitFilter;

    @Autowired
    private soqe.libro.server.filter.RequestLoggingFilter requestLoggingFilter;

    @Autowired
    private soqe.libro.server.filter.IdempotencyFilter idempotencyFilter;

    private MockMvc getMockMvc() {
        return MockMvcBuilders.webAppContextSetup(context)
                .addFilters(requestIdFilter, rateLimitFilter, requestLoggingFilter, idempotencyFilter)
                .build();
    }

    @Test
    void testRequestIdFilterGeneratesAndPropagatesHeader() throws Exception {
        MockMvc mockMvc = getMockMvc();

        // 1. Auto-generate when missing
        mockMvc.perform(get("/books"))
                .andExpect(header().exists("X-Request-ID"));

        // 2. Preserve client-supplied request ID
        String customReqId = "custom-client-trace-9999";
        mockMvc.perform(get("/books").header("X-Request-ID", customReqId))
                .andExpect(header().string("X-Request-ID", customReqId));
    }

    @Test
    void testActuatorHealthAndMetricsAccessible() throws Exception {
        MockMvc mockMvc = getMockMvc();

        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/actuator/metrics"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/actuator/prometheus"))
                .andExpect(status().isOk());
    }

    @Test
    void testIdempotencyFilterReplaysCachedResponse() throws Exception {
        MockMvc mockMvc = getMockMvc();
        String idempotencyKey = "idemp-key-test-" + System.currentTimeMillis();

        // First attempt with an invalid auth payload -> 400 or 401
        var firstResult = mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("{\"email\":\"fake@user.com\",\"password\":\"fake\"}")
                        .header("X-Idempotency-Key", idempotencyKey))
                .andExpect(header().doesNotExist("X-Idempotency-Replayed"))
                .andReturn();

        int firstStatus = firstResult.getResponse().getStatus();

        // Second attempt with same key -> should be replayed with X-Idempotency-Replayed: true
        mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("{\"email\":\"fake@user.com\",\"password\":\"fake\"}")
                        .header("X-Idempotency-Key", idempotencyKey))
                .andExpect(status().is(firstStatus))
                .andExpect(header().string("X-Idempotency-Replayed", "true"));
    }
}
