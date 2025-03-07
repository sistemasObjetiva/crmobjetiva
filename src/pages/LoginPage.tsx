import { images } from "../config/variables";
import "../styles/global.css";
import "../styles/loginPage.css";
import FooterContainer from "../components/Footer";
import { useState, FormEvent } from "react";
import { signInWithEmail } from "../config/auth";
import CustomButton from "../components/CustomButton";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const handleLogin = async (e?: FormEvent) => {
    

    if (e) e.preventDefault();
    setError("");
    try {
      const user = await signInWithEmail(email, password,navigate);
      console.log("Usuario autenticado:", user);
    } catch (err: any) {
      console.error("Error al iniciar sesión:", err.message);
      setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.");
    }
  };

  return (
    <div className="mainContainer">
      <div className="contentContainerLogin">
        <div className="letreroContainer">
          <div className="welcome-banner">
            <img src={images.logo} alt="Logo" className="logo" />
          </div>
        </div>

        <form onSubmit={handleLogin} className="loginForm">
          <div className="inputContainer">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="inputContainer">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p style={{ color: "var(--primary-color)" }}  className="error-message">{error}</p>}
          <CustomButton onClick={handleLogin} text="Iniciar sesión"  />
        </form>
      </div>
      <FooterContainer />
    </div>
  );
};

export default LoginPage;
