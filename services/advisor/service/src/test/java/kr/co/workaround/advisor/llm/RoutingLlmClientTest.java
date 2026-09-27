package kr.co.workaround.advisor.llm;

import kr.co.workaround.advisor.adapter.out.llm.LlmProperties;
import kr.co.workaround.advisor.adapter.out.llm.LlmProvider;
import kr.co.workaround.advisor.adapter.out.llm.RoutingLlmClient;
import kr.co.workaround.advisor.adapter.out.llm.mock.MockLlmProvider;
import kr.co.workaround.advisor.application.exception.LlmException;
import kr.co.workaround.advisor.application.port.LlmRole;
import kr.co.workaround.advisor.domain.mission.content.MissionContent;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RoutingLlmClientTest {

    @Test
    void routesRoleToConfiguredProviderAndReturnsFixture() {
        LlmProperties props = new LlmProperties();
        LlmProperties.RoleRoute generate = new LlmProperties.RoleRoute();
        generate.setProvider("mock");
        generate.setModel("default");
        props.setRoles(Map.of("generate", generate));

        RoutingLlmClient client = new RoutingLlmClient(List.of(new MockLlmProvider()), props);

        MissionContent content = client.complete(LlmRole.GENERATE, "any prompt", MissionContent.class);

        assertThat(content).isNotNull();
        assertThat(content.briefing()).isNotNull();
        assertThat(content.endings()).extracting("grade")
                .contains("calm", "hotfix", "dawn", "hidden");
    }

    @Test
    void unroutedRoleThrows() {
        LlmProperties props = new LlmProperties();
        props.setRoles(Map.of());
        RoutingLlmClient client = new RoutingLlmClient(List.of(new MockLlmProvider()), props);

        assertThatThrownBy(() -> client.complete(LlmRole.REVIEW, "prompt", MissionContent.class))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void fallsBackToMockWhenPrimaryProviderFails() {
        LlmProperties props = new LlmProperties();
        LlmProperties.RoleRoute generate = new LlmProperties.RoleRoute();
        generate.setProvider("failing");
        generate.setModel("claude-haiku-4-5-20251001");
        generate.setFallbackProvider("mock");
        generate.setFallbackModel("default");
        props.setRoles(Map.of("generate", generate));

        LlmProvider failingProvider = new LlmProvider() {
            @Override
            public String name() {
                return "failing";
            }

            @Override
            public <T> T complete(String model, String prompt, Class<T> type) {
                throw new LlmException("upstream unavailable");
            }
        };
        RoutingLlmClient client = new RoutingLlmClient(
                List.of(failingProvider, new MockLlmProvider()), props);

        MissionContent content = client.complete(LlmRole.GENERATE, "prompt", MissionContent.class);

        assertThat(content).isNotNull();
        assertThat(content.briefing()).isNotNull();
    }

    @Test
    void doesNotHideNonLlmProgrammingErrorsBehindFallback() {
        LlmProperties props = new LlmProperties();
        LlmProperties.RoleRoute generate = new LlmProperties.RoleRoute();
        generate.setProvider("broken");
        generate.setModel("model");
        generate.setFallbackProvider("mock");
        generate.setFallbackModel("default");
        props.setRoles(Map.of("generate", generate));

        LlmProvider brokenProvider = new LlmProvider() {
            @Override
            public String name() {
                return "broken";
            }

            @Override
            public <T> T complete(String model, String prompt, Class<T> type) {
                throw new IllegalArgumentException("programming error");
            }
        };
        RoutingLlmClient client = new RoutingLlmClient(
                List.of(brokenProvider, new MockLlmProvider()), props);

        assertThatThrownBy(() -> client.complete(LlmRole.GENERATE, "prompt", MissionContent.class))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("programming error");
    }

    @Test
    void mockProviderIdentifiesByName() {
        LlmProvider provider = new MockLlmProvider();
        assertThat(provider.name()).isEqualTo("mock");
    }
}
