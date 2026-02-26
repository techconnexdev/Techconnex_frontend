import Link from "next/link";

export default function CookieNoticeContent() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-2">Cookie Notice</h1>
      <p className="text-gray-600 text-sm mb-6">
        TechConnex — Operated by CYBERNET CONSULTING SDN. BHD. · Last Updated:
        February 2026
      </p>

      <p className="mb-6">
        This Cookie Notice explains how TechConnex, operated by CYBERNET
        CONSULTING SDN. BHD., uses cookies and similar browser technologies when
        you use our platform at https://techconnex.vip. This Notice should be
        read alongside our <Link href="/privacy">Privacy Policy</Link> and{" "}
        <Link href="/terms">Terms of Service</Link>, which together govern your
        use of TechConnex.
      </p>
      <p className="mb-6">
        TechConnex uses only essential cookies required for the platform to
        function. We do not use advertising, tracking, or analytics cookies.
      </p>

      <h2 id="what-are-cookies" className="text-xl font-semibold mt-8 mb-3">
        1. What Are Cookies?
      </h2>
      <p className="mb-4">
        Cookies are small text files that a website stores on your device
        (computer, tablet, or phone) when you visit. They allow the platform to
        remember certain information about your session or preferences so you do
        not have to re-enter them on every visit.
      </p>
      <p className="mb-4">
        TechConnex may also use related browser technologies for similar
        purposes:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>
          <strong>Local storage</strong> — stores data persistently in your
          browser across sessions (e.g. keeping you logged in)
        </li>
        <li>
          <strong>Session storage</strong> — stores data temporarily, cleared
          when you close the browser tab
        </li>
      </ul>
      <p className="mb-6">
        Collectively, we refer to cookies, local storage, and session storage as
        &quot;cookies and similar technologies&quot; throughout this Notice.
      </p>

      <h2 id="what-cookies-we-use" className="text-xl font-semibold mt-8 mb-3">
        2. What Cookies We Use
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        We use only strictly necessary cookies. No advertising, analytics, or
        third-party tracking cookies are used.
      </p>
      <p className="mb-4">
        TechConnex uses only essential (strictly necessary) cookies and browser
        storage required for the platform to operate securely and correctly.
        These fall into three categories:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>
          <strong>Authentication cookies</strong> — to keep you logged in and
          identify your session
        </li>
        <li>
          <strong>UI preference cookies</strong> — to remember your interface
          settings
        </li>
        <li>
          <strong>Security and operational data</strong> — to protect the
          platform and support troubleshooting
        </li>
      </ul>
      <div className="overflow-x-auto my-6">
        <table className="w-full border border-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 p-2 text-left">Purpose</th>
              <th className="border border-gray-200 p-2 text-left">Type</th>
              <th className="border border-gray-200 p-2 text-left">
                What is Stored
              </th>
              <th className="border border-gray-200 p-2 text-left">Duration</th>
              <th className="border border-gray-200 p-2 text-left">
                Why Essential
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-200 p-2">
                Authentication Cookie / Local Storage
              </td>
              <td className="border border-gray-200 p-2">
                Cookie / Local Storage
              </td>
              <td className="border border-gray-200 p-2">
                Login token, user ID, role
              </td>
              <td className="border border-gray-200 p-2">
                Session or until logout
              </td>
              <td className="border border-gray-200 p-2">
                Keeps you securely logged in and identifies your session
              </td>
            </tr>
            <tr>
              <td className="border border-gray-200 p-2">
                UI Preferences Cookie
              </td>
              <td className="border border-gray-200 p-2">Cookie</td>
              <td className="border border-gray-200 p-2">
                Sidebar state, layout preferences
              </td>
              <td className="border border-gray-200 p-2">Up to 1 year</td>
              <td className="border border-gray-200 p-2">
                Remembers your interface settings between visits
              </td>
            </tr>
            <tr>
              <td className="border border-gray-200 p-2">
                Security &amp; Operations
              </td>
              <td className="border border-gray-200 p-2">
                Server-side session / logs
              </td>
              <td className="border border-gray-200 p-2">
                Session data, request metadata
              </td>
              <td className="border border-gray-200 p-2">Limited period</td>
              <td className="border border-gray-200 p-2">
                Protects the platform, enforces access control, and supports
                troubleshooting
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mb-6">
        Without these, core platform features such as staying logged in,
        accessing your dashboard, and retaining layout preferences would not
        function correctly.
      </p>

      <h2 id="cookie-details" className="text-xl font-semibold mt-8 mb-3">
        3. Cookie Details by Category
      </h2>
      <h3 className="text-lg font-medium mt-4 mb-2">
        3.1 Authentication &amp; Session
      </h3>
      <p className="mb-4">
        When you log in to TechConnex, we store a login token and associated
        user data (such as your user ID and role) in a cookie and/or local
        storage. This allows the platform to recognise you as an authenticated
        user and maintain your session securely. Clearing your cookies or local
        storage will log you out.
      </p>
      <h3 className="text-lg font-medium mt-4 mb-2">3.2 UI Preferences</h3>
      <p className="mb-4">
        We may set a cookie to remember interface preferences such as sidebar
        state or layout choices, so the platform looks and behaves consistently
        across visits. These cookies do not track your behaviour or activity.
      </p>
      <h3 className="text-lg font-medium mt-4 mb-2">
        3.3 Security &amp; Platform Operations
      </h3>
      <p className="mb-6">
        Our servers use session and request metadata to enforce access control,
        detect suspicious activity, and protect the platform against abuse. This
        data is handled server-side and is necessary for the platform to operate
        securely. None of these cookies are used for marketing, advertising, or
        cross-site tracking.
      </p>

      <h2 id="what-we-do-not-use" className="text-xl font-semibold mt-8 mb-3">
        4. What We Do Not Use
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        We do not use any advertising, analytics, or social media tracking
        cookies.
      </p>
      <p className="mb-4">TechConnex does not use:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Advertising or retargeting cookies</li>
        <li>
          Third-party analytics or tracking cookies (e.g. Google Analytics,
          Facebook Pixel, or similar)
        </li>
        <li>Social media tracking cookies</li>
        <li>Behavioural profiling or interest-based targeting</li>
      </ul>
      <p className="mb-6">
        If we introduce any optional (non-essential) cookies in the future, we
        will update this Notice and, where required by applicable law (including
        Malaysian PDPA and GDPR), seek your consent before activating them.
      </p>

      <h2 id="how-long" className="text-xl font-semibold mt-8 mb-3">
        5. How Long Do Cookies Last?
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        Session cookies expire when you close your browser. Persistent cookies
        last until logout or a set period.
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>
          <strong>Session cookies / session storage</strong> — expire
          automatically when you close your browser tab or log out. Used for
          temporary data such as in-progress actions.
        </li>
        <li>
          <strong>Persistent cookies / local storage</strong> — remain on your
          device until you log out, clear your browser data, or the cookie
          reaches its set expiry (e.g. days or months). Used for authentication
          tokens and UI preferences.
        </li>
      </ul>
      <p className="mb-6">
        We do not use long-lived cookies for tracking or profiling purposes.
        Exact durations may vary based on your browser settings and our platform
        configuration.
      </p>

      <h2 id="managing-cookies" className="text-xl font-semibold mt-8 mb-3">
        6. Managing Cookies &amp; Storage
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        You can control or delete cookies via your browser settings, but this
        may affect platform functionality.
      </p>
      <p className="mb-2 font-medium">Browser Settings</p>
      <p className="mb-4">
        Most browsers allow you to view, block, and delete cookies through their
        settings. Blocking or clearing all cookies will typically: log you out
        of TechConnex; reset any saved UI preferences; prevent certain platform
        features from functioning correctly. For guidance on managing cookies in
        your specific browser, refer to the browser&apos;s help documentation.
      </p>
      <p className="mb-2 font-medium">Local &amp; Session Storage</p>
      <p className="mb-4">
        Local and session storage can be cleared via your browser&apos;s
        developer tools (usually accessible via F12) or privacy settings.
        Clearing them will log you out of TechConnex.
      </p>
      <p className="mb-2 font-medium">Opt-Out</p>
      <p className="mb-6">
        Because TechConnex uses only essential cookies, there is no separate
        opt-out for non-essential cookies. If you wish to avoid all cookie and
        storage use, you may either: adjust your browser settings to block
        cookies and local storage (noting that the platform will not function
        correctly), or refrain from using TechConnex. We may offer a cookie
        consent choice for transparency; essential cookies are still required
        for the platform to function.
      </p>

      <h2 id="third-party" className="text-xl font-semibold mt-8 mb-3">
        7. Third-Party Services
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        Third-party payment providers may set their own cookies. These are
        governed by their own policies, not ours.
      </p>
      <p className="mb-4">
        When you interact with third-party payment flows on TechConnex — such as
        those operated by Stripe or FPX — those providers may set their own
        cookies on their respective pages or redirects. These cookies are:
        governed by the privacy and cookie policies of the respective
        third-party provider; not controlled or managed by TechConnex; not used
        by TechConnex for any purpose. For Stripe&apos;s cookie and privacy
        practices, please refer to:{" "}
        <a href="https://stripe.com/en-my/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://stripe.com/en-my/privacy</a>.
        TechConnex is not responsible for the cookie practices of any third-party service.
      </p>

      <h2 id="your-rights" className="text-xl font-semibold mt-8 mb-3">
        8. Your Rights Under PDPA &amp; GDPR
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        You have rights regarding how your data is processed, including data
        stored via cookies.
      </p>
      <p className="mb-4">
        Data stored through cookies and similar technologies may constitute
        personal data under Malaysia&apos;s Personal Data Protection Act 2010
        (PDPA) and, where applicable, the EU General Data Protection Regulation
        (GDPR). Depending on your jurisdiction, you may have the right to:
        access the personal data we hold about you, including session and
        authentication data; request correction or deletion of your data;
        withdraw consent for any non-essential data processing (where
        applicable); object to processing based on legitimate interests.
      </p>
      <p className="mb-6">
        To exercise any of these rights, please contact us at
        techconn@techconnex.vip or submit a Data Subject Access Request through
        the platform. For full details of your rights, please refer to our
        Privacy Policy.
      </p>

      <h2 id="updates" className="text-xl font-semibold mt-8 mb-3">
        9. Updates to This Notice
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        We will update this Notice if our cookie practices change.
      </p>
      <p className="mb-6">
        We may update this Cookie Notice from time to time, for example if we:
        introduce optional (non-essential) cookies; change our technology
        infrastructure or third-party providers; are required to update by
        changes in applicable law. The &quot;Last Updated&quot; date at the top
        of this Notice will reflect the most recent revision. We encourage you
        to review this page periodically. For material changes affecting your
        rights, we will provide notice through the platform or by email.
      </p>

      <h2 id="contact" className="text-xl font-semibold mt-8 mb-3">
        10. Contact Us
      </h2>
      <p className="mb-4">
        If you have questions or concerns about our use of cookies or similar
        technologies, please contact us:
      </p>
      <div className="overflow-x-auto my-4">
        <table className="w-full border border-gray-200 text-sm max-w-md">
          <tbody>
            <tr>
              <td className="border border-gray-200 p-2 font-medium">
                Company
              </td>
              <td className="border border-gray-200 p-2">
                CYBERNET CONSULTING SDN. BHD. (202501039024 / 1640433-T)
              </td>
            </tr>
            <tr>
              <td className="border border-gray-200 p-2 font-medium">
                Platform
              </td>
              <td className="border border-gray-200 p-2">TechConnex</td>
            </tr>
            <tr>
              <td className="border border-gray-200 p-2 font-medium">
                Address
              </td>
              <td className="border border-gray-200 p-2">
                Unit 2-1, Level 2, The Podium, Tower 3, UOA Business Park,
                Seksyen U1, 40150 Shah Alam, Selangor, Malaysia
              </td>
            </tr>
            <tr>
              <td className="border border-gray-200 p-2 font-medium">Email</td>
              <td className="border border-gray-200 p-2">
                techconn@techconnex.vip
              </td>
            </tr>
            <tr>
              <td className="border border-gray-200 p-2 font-medium">
                Website
              </td>
              <td className="border border-gray-200 p-2">
                <a
                  href="https://cybernet.com.my/#contactus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://cybernet.com.my/#contactus
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-600 mt-8">
        © 2026 CYBERNET CONSULTING SDN. BHD. — All rights reserved.
      </p>
    </>
  );
}
