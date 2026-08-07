import AboutPage from "../../components/AboutPage";

// Generic placeholder copy — neutral, ecosystem-wide overview. Replace with real facts (founding,
// leadership, legal mandate) before public launch.
const SECTIONS = [
  { heading: "Mission", body: "To give every citizen and every party member a direct, transparent channel — one for raising concerns and seeing them resolved, another for participating in the party's growth." },
  { heading: "Vision", body: "A digitally connected organization where oversight and civic participation are accessible, accountable, and trackable at every level." },
  { heading: "Platform Objectives", body: "Route every complaint and every membership action to the right jurisdiction, keep a transparent audit trail, and remove friction from both civic oversight and party participation." },
  { heading: "Ethics & Investigation Office", body: "Handles complaint intake, investigation, and resolution — for the public and for party matters — with support for anonymous submissions and full status tracking. Learn more on the Ethics & Investigation portal." },
  { heading: "Membership Portal", body: "Handles party registration, membership verification, renewal, and engagement — from applicant through probationary to full membership. Learn more on the Membership portal." },
  { heading: "Core Values", body: "Fairness, transparency, and accountability guide both offices, regardless of who is involved or which portal they use." },
  { heading: "Digital Transformation", body: "Both offices are organized across the same jurisdiction hierarchy — Zone, District, Town Administration, and Office — with a Super Admin tier providing national coordination." },
  { heading: "Getting Started", body: "New visitors can choose the portal that matches what they need — filing or tracking a complaint, or joining and participating in the party — from the Get Started page." },
];

export default function About() {
  return (
    <AboutPage
      title="About This Platform"
      intro={[
        "This platform connects citizens and party members to two distinct offices: an Ethics & Investigation office for complaint handling and oversight, and a Membership office for Xisbiga Barwaaqo Laantiisa DDS party participation.",
        "Each office has its own dedicated portal, registration flow, and administrative hierarchy, while sharing the same commitment to transparency and accountability.",
      ]}
      sections={SECTIONS}
    />
  );
}
