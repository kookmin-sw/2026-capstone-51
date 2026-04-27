package com.github.logi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class LogiApplication {

	public static void main(String[] args) {
		SpringApplication.run(LogiApplication.class, args);
	}

}
