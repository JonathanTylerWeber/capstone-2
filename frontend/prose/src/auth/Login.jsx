import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { Container, Form, Button, Nav } from "react-bootstrap"
import "./Login.css"

function LoginForm({ handleLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await handleLogin(username, password);
    if (result && result.success) {
      setLoggedIn(true);
    } else {
      console.error("Login failed:", result ? result.error : "Unknown error");
      setError(result ? result.error : "Unknown error");
      return { success: false };
    }
  };

  if (loggedIn) {
    return <Navigate to="/" />;
  }

  return (
    <Container className="m-auto cntr">
      <Form onSubmit={handleSubmit}>
        <h1 className="login">Login</h1>
        {error && <div className="alert alert-danger">{error}</div>}
        <Form.Group className="mb-3" controlId="username">
          <Form.Label>Username:</Form.Label>
          <Form.Control type="text" value={username}
            onChange={(e) => setUsername(e.target.value)}
            required placeholder="Enter username" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Password:</Form.Label>
          <Form.Control type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            required placeholder="Enter password" />
        </Form.Group>

        <Button className="btn auth-btn" variant="primary" type="submit">
          Submit
        </Button>
      </Form>
      <Nav.Link className="nav-link my-3 signup" exact='true' href="/signup">Don't have an account yet?</Nav.Link>
    </Container>
  );
}

export default LoginForm;





