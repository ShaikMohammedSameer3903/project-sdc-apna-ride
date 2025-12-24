# Multi-stage build for Spring Boot application
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build

WORKDIR /app

# Copy pom and download dependencies
COPY pom.xml .
RUN mvn -q -e dependency:go-offline -B

# Copy source
COPY src ./src

# Build jar
RUN mvn -q -e clean package -DskipTests

# Runtime image
FROM eclipse-temurin:17-jre-alpine

ENV JAVA_OPTS=""
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S appuser && adduser -u 1001 -S appuser -G appuser

# Copy built jar
COPY --from=build /app/target/*.jar /app/app.jar

# Install curl for healthcheck
RUN apk add --no-cache curl

USER appuser
EXPOSE 9031

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://localhost:9031/actuator/health || exit 1

ENTRYPOINT ["sh","-c","exec java $JAVA_OPTS -jar /app/app.jar"]
