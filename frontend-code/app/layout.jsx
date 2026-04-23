import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title:       "EduPredict — AI Student Performance",
  description: "AI-powered student performance prediction system"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
