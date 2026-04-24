package com.github.logi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class LogiApplication {

	public static void main(String[] args) {
		SpringApplication.run(LogiApplication.class, args);
	}

}
