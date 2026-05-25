import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import dbConnect from "./lib/mongodb"
import User from "./models/User"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          await dbConnect();
          
          // Check if user exists
          const existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            console.warn(`Acceso denegado: El correo ${user.email} no está registrado en la base de datos.`);
            return false; // Denegar acceso a usuarios no pre-registrados
          }
          if (!existingUser.isActive) {
            console.warn(`Acceso denegado: El usuario ${user.email} está inactivo.`);
            return false; // Denegar acceso si está inactivo
          }
          return true; // Continuar login
        } catch (error) {
          console.error("Error guardando usuario en DB:", error);
          return false; // Denegar login si la BD falla
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Siempre obtener el rol actualizado de la base de datos para la sesión en vivo
      if (token.email) {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.isActive = dbUser.isActive;
          }
        } catch (error) {
          console.error("Error fetching user for JWT:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isActive = token.isActive;
      }
      return session;
    }
  },
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
  pages: {
    // signIn: '/login', // Si tuviéramos una página personalizada
  }
})
