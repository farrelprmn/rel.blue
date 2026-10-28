import { useClerk } from "@clerk/nextjs";
import { faArrowRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Head from "next/head";
import { TransitionLink } from "@/components/navigation";
import Typewriter from "@/components/typewriter";

// the button goes to Clerk's hosted sign-in (NEXT_PUBLIC_CLERK_SIGN_IN_URL in .env), which comes back
// to the dashboard with the session. a load of this page while signed in is redirected by proxy.js
export default function Login() {
  const { redirectToSignIn } = useClerk();

  return (
    <div className="page center login">
      <Head>
        <title>Log in · Farrel&apos;s Portofolio</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Typewriter as="h1" text="who's there?" />
      <div>
        <button
          type="button"
          className="sso"
          onClick={() =>
            redirectToSignIn({ signInForceRedirectUrl: "/d/dashboard" })
          }
        >
          <FontAwesomeIcon icon={faArrowRightToBracket} aria-hidden="true" />
          log in with SSO
        </button>
      </div>
      <p className="hint">
        not farrel?{" "}
        <TransitionLink href="/" className="u">
          go back home
        </TransitionLink>
      </p>
    </div>
  );
}
