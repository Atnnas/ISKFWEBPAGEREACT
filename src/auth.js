import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import dbConnect from "./lib/mongodb"
import User from "./models/User"
import Dojo from "./models/Dojo"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await dbConnect();
          
          // Check if user exists
          const existingUser = await User.findOne({ email: user?.email });
          
          if (!existingUser) {
            console.warn(`Acceso denegado: El correo ${user?.email} no está registrado en la base de datos.`);
            return false; // Denegar acceso a usuarios no pre-registrados
          }
          if (!existingUser.isActive) {
            console.warn(`Acceso denegado: El usuario ${user?.email} está inactivo.`);
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
    async jwt({ token }) {
      if (!token) return {};
      // Siempre obtener el rol actualizado de la base de datos para la sesión en vivo
      if (token.email) {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: token.email }).lean();
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.isActive = dbUser.isActive;
            token.dojoId = dbUser.dojoId ? dbUser.dojoId.toString() : null;
            token.dojoName = dbUser.dojoName || null;

            // Asociar dojo por email o por dojoId
            let dojoDoc = null;
            if (token.dojoId) {
              dojoDoc = await Dojo.findById(token.dojoId).lean();
            }
            if (!dojoDoc && token.email) {
              const safeEmail = token.email.trim();
              const escapedEmail = safeEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              dojoDoc = await Dojo.findOne({ 
                email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } 
              }).lean();
            }

            if (dojoDoc) {
              token.dojoId = dojoDoc._id.toString();
              token.dojoName = dojoDoc.name;
              token.dojoLogo = dojoDoc.logo || '/images/dojos/default_logo.jpg';
            } else {
              token.dojoLogo = null;
            }
          }
        } catch (error) {
          console.error("Error fetching user for JWT:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (session?.user) {
          session.user.id = token?.id || null;
          session.user.role = token?.role || null;
          session.user.isActive = token?.isActive !== undefined ? token.isActive : true;
          session.user.dojoId = token?.dojoId || null;
          session.user.dojoName = token?.dojoName || null;
          session.user.dojoLogo = token?.dojoLogo || null;
        }
      } catch (error) {
        console.error("Error construyendo sesión en NextAuth:", error);
      }
      return session;
    }
  },
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    // signIn: '/login', // Si tuviéramos una página personalizada
  }
})
