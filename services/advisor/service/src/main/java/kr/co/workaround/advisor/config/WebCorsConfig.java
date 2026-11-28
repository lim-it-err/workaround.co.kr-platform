package kr.co.workaround.advisor.config;

import kr.co.workaround.advisor.adapter.in.web.AdvisorAuthInterceptor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableConfigurationProperties(AdvisorCorsProperties.class)
public class WebCorsConfig implements WebMvcConfigurer {

    private final AdvisorCorsProperties corsProperties;
    private final AdvisorAuthInterceptor advisorAuthInterceptor;

    public WebCorsConfig(AdvisorCorsProperties corsProperties, AdvisorAuthInterceptor advisorAuthInterceptor) {
        this.corsProperties = corsProperties;
        this.advisorAuthInterceptor = advisorAuthInterceptor;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(corsProperties.resolvedAllowedOrigins().toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
        // 프런트가 로컬/배포 모드를 판별하려고 /health 를 읽는다 (TKT-237) — 읽기 전용 GET 만.
        registry.addMapping("/health")
                .allowedOrigins(corsProperties.resolvedAllowedOrigins().toArray(String[]::new))
                .allowedMethods("GET");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(advisorAuthInterceptor)
                .addPathPatterns("/api/advisor/**");
    }
}
