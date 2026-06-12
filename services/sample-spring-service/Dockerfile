FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml /workspace/pom.xml
COPY src /workspace/src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/target/sample-spring-service-0.0.1-SNAPSHOT.jar /app/app.jar
EXPOSE 8002
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
