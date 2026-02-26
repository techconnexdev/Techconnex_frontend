import Link from "next/link";

export default function PrivacyPolicyContent() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-600 text-sm mb-6">
        TechConnex — Operated by CYBERNET CONSULTING SDN. BHD. · Last Updated:
        February 21, 2026
      </p>

      <p className="mb-6">
        This Privacy Notice for CYBERNET CONSULTING SDN. BHD. (&quot;we,&quot;
        &quot;us,&quot; or &quot;our&quot;) describes how and why we collect,
        store, use, and share your personal information when you use TechConnex
        — our ICT services freelancing platform that connects companies with
        verified service providers. This Notice applies to all users, including
        companies posting projects and service providers (freelancers,
        professionals, or firms) submitting proposals.
      </p>
      <p className="mb-6">
        We are committed to handling your data transparently and securely in
        accordance with applicable data protection laws, including
        Malaysia&apos;s Personal Data Protection Act 2010 (PDPA) and
        GDPR-aligned principles for international users. Questions or concerns?
        Contact us at techconn@techconnex.vip or via{" "}
        <a
          href="https://cybernet.com.my/#contactus"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          https://cybernet.com.my/#contactus
        </a>
        .
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold mb-3">Summary of Key Points</h2>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>
            <strong>What we collect:</strong> We collect information you provide
            during registration, project posting, proposal submission,
            KYC/identity verification, and use of the platform.
          </li>
          <li>
            <strong>Sensitive data:</strong> We may process sensitive data such
            as government-issued ID numbers for KYC/identity verification of
            service providers.
          </li>
          <li>
            <strong>Third parties:</strong> We do not collect information from
            third parties.
          </li>
          <li>
            <strong>How we use it:</strong> We process your data to operate the
            platform, match projects with providers, process milestone payments,
            resolve disputes, and comply with law.
          </li>
          <li>
            <strong>Who we share with:</strong> We share data only in limited
            situations, with payment processors (Stripe, FPX), AI service
            providers (OpenAI), and as required by law.
          </li>
          <li>
            <strong>Storage:</strong> Your data is stored on servers located in
            Singapore with appropriate safeguards.
          </li>
          <li>
            <strong>Your rights:</strong> Depending on your jurisdiction, you
            have rights to access, correct, delete, and port your personal data.
          </li>
          <li>
            <strong>How to act:</strong> To exercise your rights, submit a
            request to techconn@techconnex.vip.
          </li>
        </ul>
      </div>

      <h2 id="what-we-collect" className="text-xl font-semibold mt-8 mb-3">
        1. What Information Do We Collect?
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        We collect information you provide when registering, using platform
        features, or communicating with us.
      </p>
      <p className="mb-2 font-medium">Information You Provide Directly</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Full name and contact details (email address, phone number)</li>
        <li>
          Account credentials (username, password — stored in encrypted form)
        </li>
        <li>
          Professional profile information: job title, skills, portfolio, work
          history (for service providers)
        </li>
        <li>
          Company details: organisation name, industry, and project requirements
          (for companies)
        </li>
        <li>
          Project descriptions, proposals, bids, and milestone deliverables
        </li>
        <li>
          Messages, files, and attachments exchanged on the platform — including
          in the support chat
        </li>
        <li>
          Payout details: bank account number, PayPal, e-wallet information or
          other payment information the user provides (for service providers
          receiving payments)
        </li>
      </ul>
      <p className="mb-2 font-medium">Sensitive Information</p>
      <p className="mb-4">
        With your consent or as required by law, we may collect
        government-issued identification numbers (such as MyKad, passport
        number, or equivalent) as part of our Know Your Customer (KYC) identity
        verification process for service providers. This data is handled with
        the highest level of security and is used solely for verification
        purposes.
      </p>
      <p className="mb-2 font-medium">Payment Data</p>
      <p className="mb-6">
        Payments are processed via third-party providers (Stripe and FPX). We do
        not store full card or payment credentials on our systems. All payment
        data is handled by Stripe — see their{" "}
        <a href="https://stripe.com/en-my/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">privacy notice</a>.
        Provider payout details are securely stored for payout processing only.
      </p>

      <h2
        id="automatically-collected"
        className="text-xl font-semibold mt-8 mb-3"
      >
        Automatically Collected Information
      </h2>
      <ul className="list-disc pl-6 mb-6 space-y-1">
        <li>
          IP address and device/browser information for security and fraud
          prevention
        </li>
        <li>
          Session data and platform usage analytics (pages visited, features
          used, timestamps)
        </li>
        <li>Cookies and similar tracking technologies (see Section 5)</li>
      </ul>
      <p className="mb-8">
        All information you provide must be true, complete, and accurate. Please
        notify us of any changes.
      </p>

      <h2 id="how-we-process" className="text-xl font-semibold mt-8 mb-3">
        2. How Do We Process Your Information?
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        We process your data to run the TechConnex platform, match projects and
        providers, handle payments, resolve disputes, and improve our platform.
      </p>
      <ul className="list-disc pl-6 mb-6 space-y-1">
        <li>
          <strong>Account creation and authentication</strong> — to create,
          manage, and secure your account
        </li>
        <li>
          <strong>Marketplace operations</strong> — to enable companies to post
          projects and providers to submit proposals and bids
        </li>
        <li>
          <strong>AI-powered matching</strong> — to generate match scores and
          recommendation explanations, helping companies find suitable providers
          and vice versa
        </li>
        <li>
          <strong>Milestone and payment management</strong> — to hold funds in
          escrow, release payments upon approval, and process provider payouts
        </li>
        <li>
          <strong>Dispute resolution</strong> — to review messages, files, and
          evidence when a milestone dispute is raised
        </li>
        <li>
          <strong>KYC/identity verification</strong> — to verify the identity of
          service providers as required for platform trust and regulatory
          compliance
        </li>
        <li>
          <strong>Customer support</strong> — to respond to queries via our
          AI-powered support chat and human agents
        </li>
        <li>
          <strong>Platform security and fraud prevention</strong> — to detect
          and prevent misuse, fraud, or unauthorised access
        </li>
        <li>
          <strong>Communications</strong> — to send service notifications,
          policy updates, and (with consent) relevant product updates
        </li>
        <li>
          <strong>Legal compliance</strong> — to comply with applicable laws,
          court orders, or regulatory requirements
        </li>
      </ul>

      <h2 id="legal-bases" className="text-xl font-semibold mt-8 mb-3">
        3. Legal Bases for Processing
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        We process your data on the basis of contract performance, legal
        obligation, legitimate interest, and consent depending on the context.
      </p>
      <p className="mb-2 font-medium">Malaysia (PDPA 2010)</p>
      <p className="mb-4">
        Under the PDPA, we process personal data only with your consent (express
        or implied) or where processing is necessary for the performance of our
        services. You may withdraw consent at any time, though this may affect
        your ability to use certain features.
      </p>
      <p className="mb-2 font-medium">EU / UK Users (GDPR / UK GDPR)</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>
          <strong>Contract performance</strong> — processing necessary to fulfil
          our agreement with you (e.g. account management, payment processing)
        </li>
        <li>
          <strong>Legal obligation</strong> — to comply with applicable laws and
          regulations
        </li>
        <li>
          <strong>Legitimate interests</strong> — fraud prevention, platform
          security, and service improvement
        </li>
        <li>
          <strong>Consent</strong> — for marketing communications and optional
          data uses
        </li>
      </ul>
      <p className="mb-2 font-medium">Canadian Users</p>
      <p className="mb-6">
        We rely on express or implied consent for data collection. You may
        withdraw consent at any time by contacting us.
      </p>

      <h2 id="sharing" className="text-xl font-semibold mt-8 mb-3">
        4. When and With Whom Do We Share Your Information?
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        We share data only with specific parties necessary to operate
        TechConnex, and never sell your data.
      </p>
      <p className="mb-2 font-medium">Payment Processors</p>
      <p className="mb-4">
        We share payment-relevant data with Stripe and FPX to process escrow
        transactions and provider payouts. These providers operate under their
        own privacy and security frameworks.
      </p>
      <p className="mb-2 font-medium">AI Service Providers</p>
      <p className="mb-4">
        Our AI features are powered by OpenAI and Langchain. Data such as
        project descriptions, proposals, profile information, and support chat
        inputs may be processed by these providers solely to enable AI
        functionality. We have data processing agreements in place with these
        providers.
      </p>
      <p className="mb-2 font-medium">Other Platform Users</p>
      <p className="mb-4">
        When you post a project or submit a proposal, certain profile and
        project information is visible to relevant counterparties on the
        platform (e.g. a company can see a provider&apos;s profile when
        reviewing bids). Review your privacy settings to control what is
        visible.
      </p>
      <p className="mb-2 font-medium">Legal and Regulatory Authorities</p>
      <p className="mb-4">
        We may disclose your data where required by Malaysian law, court order,
        regulatory directive, or to protect the rights and safety of users or
        third parties.
      </p>
      <p className="mb-2 font-medium">Business Transfers</p>
      <p className="mb-6">
        In the event of a merger, acquisition, or sale of assets, your data may
        be transferred. We will notify users of any such change through the
        platform. We do not sell your personal data to third parties.
      </p>

      <h2 id="cookies-tracking" className="text-xl font-semibold mt-8 mb-3">
        5. Cookies and Tracking Technologies
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        We use cookies and similar technologies for authentication, security,
        analytics, and platform functionality.
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>
          <strong>Essential cookies</strong> — required for login sessions,
          security, and core platform functions
        </li>
        <li>
          <strong>Analytics cookies</strong> — to understand how users navigate
          and use TechConnex (e.g. Google Analytics)
        </li>
        <li>
          <strong>Preference cookies</strong> — to remember your settings and
          customisations
        </li>
      </ul>
      <p className="mb-6">
        We do not use cookies for advertising or sell cookie data to third
        parties. You can manage your cookie preferences via your browser
        settings or through our <Link href="/cookies">Cookie Notice</Link>.
      </p>

      <h2 id="ai-features" className="text-xl font-semibold mt-8 mb-3">
        6. AI-Powered Features
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        TechConnex uses AI to power project-provider matching, bid evaluation,
        profile drafting, and in-platform support.
      </p>
      <p className="mb-4">
        Our AI features include: project-provider matching; bid evaluation
        assistance; profile and project drafting; support chat. AI outputs are
        informational only and do not replace human judgment. We do not
        guarantee the accuracy or suitability of AI-generated recommendations.
        If you upload documents for AI drafting assistance, the content is
        processed by our AI service providers (OpenAI, Langchain) and is not
        used to train their models beyond our data processing agreements. Where
        AI-based decisions produce significant effects (e.g. flagging accounts
        for review), you have the right to request human review. Contact us at
        techconn@techconnex.vip.
      </p>

      <h2 id="data-transfers" className="text-xl font-semibold mt-8 mb-3">
        7. International Data Transfers
      </h2>
      <p className="mb-4">
        Our primary servers are located in Singapore. When you use AI features
        or payment processing, your data may be transferred to and processed in
        the United States (by OpenAI, Stripe) or other countries. We ensure such
        transfers are subject to adequate safeguards, including Standard
        Contractual Clauses (SCCs) approved by the European Commission, for
        transfers involving EEA/UK users; Data Processing Agreements with all
        third-party providers; and compliance with Malaysia&apos;s PDPA
        requirements on cross-border data transfer.
      </p>

      <h2 id="retention" className="text-xl font-semibold mt-8 mb-3">
        8. How Long Do We Keep Your Information?
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        We retain your data for as long as your account is active, with some
        data retained longer for legal compliance.
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>
          <strong>Account and profile data</strong> — retained for the duration
          of your account, and up to 7 years after closure for legal and tax
          compliance
        </li>
        <li>
          <strong>Project and transaction records</strong> — retained for 7
          years in line with Malaysian financial recordkeeping requirements
        </li>
        <li>
          <strong>KYC/identity verification data</strong> — retained as required
          by applicable law or for as long as necessary to resolve disputes
        </li>
        <li>
          <strong>Support chat logs</strong> — retained for 2 years
        </li>
        <li>
          <strong>Anonymised analytics data</strong> — retained indefinitely
          (this cannot be linked back to you)
        </li>
      </ul>
      <p className="mb-6">
        When there is no longer a legitimate purpose for retaining your data, we
        will delete or anonymise it.
      </p>

      <h2 id="security" className="text-xl font-semibold mt-8 mb-3">
        9. How Do We Keep Your Information Safe?
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        We implement technical and organisational measures to protect your data,
        though no system is 100% secure.
      </p>
      <ul className="list-disc pl-6 mb-6 space-y-1">
        <li>Encryption of data in transit (TLS/HTTPS) and at rest</li>
        <li>Hashed and salted storage of passwords</li>
        <li>
          Role-based access controls — only authorised personnel can access
          personal data
        </li>
        <li>
          Secure handling of KYC and payout data, with restricted internal
          access
        </li>
        <li>Regular security monitoring and vulnerability assessments</li>
      </ul>
      <p className="mb-6">
        Despite these measures, no online system is completely secure. You
        access TechConnex at your own risk and should use a secure network
        environment. Please notify us immediately of any suspected security
        breach at techconn@techconnex.vip.
      </p>

      <h2 id="minors" className="text-xl font-semibold mt-8 mb-3">
        10. Information from Minors
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-6">
        TechConnex is not intended for users under 18 and we do not knowingly
        collect data from minors. TechConnex is a professional marketplace
        intended for users aged 18 and above. We do not knowingly collect or
        solicit data from individuals under 18. If we discover that a minor has
        created an account, we will deactivate it and delete their data. If you
        believe a minor has registered, please contact us at
        techconn@techconnex.vip.
      </p>

      <h2 id="privacy-rights" className="text-xl font-semibold mt-8 mb-3">
        11. Your Privacy Rights
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        Depending on your jurisdiction, you have rights to access, correct,
        delete, and port your personal data.
      </p>
      <p className="mb-4">Depending on where you are located, you may have:</p>
      <ul className="list-disc pl-6 mb-6 space-y-1">
        <li>
          <strong>Right of access</strong> — to request a copy of the personal
          data we hold about you
        </li>
        <li>
          <strong>Right to rectification</strong> — to request correction of
          inaccurate or incomplete data
        </li>
        <li>
          <strong>Right to erasure</strong> — to request deletion of your data
          (subject to legal retention requirements)
        </li>
        <li>
          <strong>Right to restrict processing</strong> — to request that we
          limit how we use your data in certain circumstances
        </li>
        <li>
          <strong>Right to data portability</strong> — to receive your data in a
          structured, machine-readable format
        </li>
        <li>
          <strong>Right to object</strong> — to object to processing based on
          legitimate interests
        </li>
        <li>
          <strong>Right to human review</strong> — where AI-based decisions
          produce significant effects, to request review by a human agent
        </li>
      </ul>
      <p className="mb-6">
        To exercise any of these rights, contact us at techconn@techconnex.vip
        or submit a Data Subject Access Request via the platform.
      </p>

      <h2 id="pdpa" className="text-xl font-semibold mt-8 mb-3">
        12. Malaysian Users — PDPA Rights
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-4">
        As a Malaysian-based company, we comply with the Personal Data
        Protection Act 2010 (Malaysia).
      </p>
      <p className="mb-4">
        Under the PDPA 2010, Malaysian users have the right to: access the
        personal data we hold about you (subject to certain limitations);
        correct personal data that is inaccurate, incomplete, or misleading;
        withdraw consent for processing (noting this may affect platform
        functionality); request information about how your data is being used.
        To make a request, contact our Data Protection Officer at
        techconn@techconnex.vip. We will acknowledge requests within 5 business
        days and aim to respond fully within 21 days, as required by the PDPA.
      </p>

      <h2 id="dnt" className="text-xl font-semibold mt-8 mb-3">
        13. Do-Not-Track Features
      </h2>
      <p className="mb-6">
        Some browsers include a Do-Not-Track (DNT) signal. As there is currently
        no uniform technical standard for interpreting DNT signals, TechConnex
        does not currently respond to DNT signals. We will update this policy if
        a recognised standard is established.
      </p>

      <h2 id="updates" className="text-xl font-semibold mt-8 mb-3">
        14. Updates to This Notice
      </h2>
      <p className="mb-2 font-medium">In Short:</p>
      <p className="mb-6">
        We may update this Notice periodically. Material changes will be
        communicated to users. We will notify you of material changes by posting
        a prominent notice within the platform or by email. The &quot;Last
        Updated&quot; date at the top of this Notice reflects the most recent
        revision. We encourage you to review this Notice periodically.
      </p>

      <h2 id="contact" className="text-xl font-semibold mt-8 mb-3">
        15. Contact Us
      </h2>
      <p className="mb-4">
        If you have questions or concerns about this Privacy Notice or about how
        your data is handled, please contact us:
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

      <h2 id="reviewing-data" className="text-xl font-semibold mt-8 mb-3">
        16. Reviewing, Updating, or Deleting Your Data
      </h2>
      <p className="mb-4">
        You can review and update your personal information by logging in to
        your account settings. To request deletion of your data, go to the
        profile tab → security, then delete or contact us at
        techconn@techconnex.vip. Please note: account deletion requests will be
        processed within 30 days; some data may be retained in line with our
        legal retention obligations (see Section 8); deletion of your account
        does not automatically erase data related to active contracts,
        outstanding payments, or ongoing disputes. You may also submit a formal
        Data Subject Access Request (DSAR) through the platform or via email.
      </p>
      <p className="text-sm text-gray-600 mt-8">
        © 2026 CYBERNET CONSULTING SDN. BHD. — All rights reserved.
      </p>
    </>
  );
}
