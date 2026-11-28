package kr.co.workaround.advisor.adapter.in.web;

import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    private final Environment environment;

    public HealthController(Environment environment) {
        this.environment = environment;
    }

    @GetMapping("/health")
    Map<String, String> health() {
        return Map.of(
                "status", "ok",
                "service", "advisor",
                "profile", activeProfile()
        );
    }

    // mock | claude | ollama. 프로필이 없거나 모르는 값이면 LLM 이 없는 mock 으로 본다.
    private String activeProfile() {
        for (String profile : environment.getActiveProfiles()) {
            if (profile.equals("claude") || profile.equals("ollama") || profile.equals("mock")) {
                return profile;
            }
        }
        return "mock";
    }
}
