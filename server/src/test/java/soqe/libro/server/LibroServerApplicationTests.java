package soqe.libro.server;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class LibroServerApplicationTests {

    @org.springframework.beans.factory.annotation.Autowired
    private soqe.libro.server.controller.AuthController authController;

    @org.springframework.beans.factory.annotation.Autowired
    private soqe.libro.server.controller.UserController userController;

    @Test
    void contextLoads() {
    }

    @Test
    void testRegisterEndpoint() {
        soqe.libro.server.dto.RegisterRequest req = new soqe.libro.server.dto.RegisterRequest(
            "empera@castle.org", "password123", "Hoang Vu", null
        );
        authController.register(req);
    }

    @Test
    void testLoginAndGetMe() {
        var loginRes = authController.login(new soqe.libro.server.dto.LoginRequest("admin@libro.com", "admin123"));
        org.junit.jupiter.api.Assertions.assertNotNull(loginRes.getBody());
        org.junit.jupiter.api.Assertions.assertNotNull(loginRes.getBody().getData());

        // Test getCurrentUser with email
        var userResByEmail = userController.getCurrentUser(() -> "admin@libro.com");
        org.junit.jupiter.api.Assertions.assertNotNull(userResByEmail.getBody());
        org.junit.jupiter.api.Assertions.assertEquals("admin@libro.com", userResByEmail.getBody().email());
    }

}
