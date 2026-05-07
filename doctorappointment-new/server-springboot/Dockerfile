# --- build stage ---
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q -DskipTests package

# --- runtime stage ---
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/doctor-appointment-1.0.0.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java","-Djdk.tls.client.protocols=TLSv1.2","-jar","/app/app.jar"]
