// "use client";

// import { useEffect, useRef } from "react";
// import { usePathname, useRouter } from "next/navigation";

// type SessionResponse = { loggedIn: boolean; registered?: boolean };

// /**
//  * When the user is logged in (wallet/social JWT) but not yet registered
//  * (no User record on backend), redirect to /register. Skips redirect on
//  * /register and /settings so they can complete registration or use Settings.
//  */
// export function RegistrationRedirect() {
//   const pathname = usePathname();
//   const router = useRouter();
//   const didRedirect = useRef(false);

//   useEffect(() => {
//     if (pathname == null) return;
//     if (pathname.startsWith("/register") || pathname.startsWith("/settings")) {
//       return;
//     }
//     if (didRedirect.current) return;

//     let cancelled = false;
//     fetch("/api/auth/session", { credentials: "include" })
//       .then((res) => res.json() as Promise<SessionResponse>)
//       .then((data) => {
//         if (cancelled) return;
//         if (data.loggedIn === true && data.registered === false) {
//           didRedirect.current = true;
//           router.replace("/register");
//         }
//       })
//       .catch(() => {});

//     return () => {
//       cancelled = true;
//     };
//   }, [pathname, router]);

//   return null;
// }
