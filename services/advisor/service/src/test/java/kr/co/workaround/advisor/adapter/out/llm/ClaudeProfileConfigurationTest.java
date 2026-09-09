package kr.co.workaround.advisor.adapter.out.llm;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ClassPathResource;

import static org.assertj.core.api.Assertions.assertThat;

class ClaudeProfileConfigurationTest {

    @Test
    void routesEveryLlmRoleToHaikuWithMockFallback() throws Exception {
        StandardEnvironment environment = new StandardEnvironment();
        var sources = new YamlPropertySourceLoader()
                .load("application-claude", new ClassPathResource("application-claude.yml"));
        sources.forEach(environment.getPropertySources()::addLast);

        LlmProperties properties = Binder.get(environment)
                .bind("advisor.llm", LlmProperties.class)
                .orElseThrow(() -> new IllegalStateException("Claude LLM configuration was not bound"));

        assertThat(properties.getRoles()).containsOnlyKeys("generate", "review", "chat");
        assertThat(properties.getRoles().values()).allSatisfy(route -> {
            assertThat(route.getProvider()).isEqualTo("claude");
            assertThat(route.getModel()).isEqualTo("claude-haiku-4-5-20251001");
            assertThat(route.getFallbackProvider()).isEqualTo("mock");
            assertThat(route.getFallbackModel()).isEqualTo("default");
        });
    }
}
