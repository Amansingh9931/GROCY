# One Dockerfile for every Java module:  docker build --build-arg MODULE=user-service .
FROM maven:3.9-eclipse-temurin-21 AS build
ARG MODULE
WORKDIR /src
COPY pom.xml .
COPY common common
COPY ${MODULE} ${MODULE}
# the other modules are only needed so the reactor can resolve the parent's <modules>
RUN for m in api-gateway user-service product-service cart-service address-service order-service delivery-service tracking-service; do \
      [ "$m" = "${MODULE}" ] || { mkdir -p $m && echo '<project xmlns="http://maven.apache.org/POM/4.0.0"><modelVersion>4.0.0</modelVersion><parent><groupId>com.grocecart</groupId><artifactId>grocecart-parent</artifactId><version>1.0.0</version></parent><artifactId>'$m'</artifactId></project>' > $m/pom.xml; }; \
    done
RUN mvn -q -B -pl ${MODULE} -am -DskipTests package

FROM eclipse-temurin:21-jre
ARG MODULE
WORKDIR /app
COPY --from=build /src/${MODULE}/target/app.jar app.jar
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
