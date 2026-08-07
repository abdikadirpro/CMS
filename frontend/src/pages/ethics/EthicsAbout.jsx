import AboutPage from "../../components/AboutPage";

// Generic placeholder copy — structural and professional, but not real facts. Replace every
// section body with the office's actual legal mandate, workflow, and policy text before launch.
const SECTIONS = [
  { heading: "Office Overview", body: "The Ethics, Investigation & Complaint Management Office exists to receive, review, and resolve conduct-related complaints fairly and consistently across every level of the organization." },
  { heading: "Legal Mandate", body: "[Placeholder — insert the specific statute, charter, or internal policy that establishes this office's authority to investigate and act on complaints.]" },
  { heading: "Responsibilities", body: "The office is responsible for intake, triage, investigation, and resolution of complaints, as well as maintaining records and reporting on outcomes to the appropriate oversight bodies." },
  { id: "process", heading: "Complaint Handling Process", body: "Every complaint submitted — identified or anonymous — receives a unique tracking ID, is routed to the correct jurisdiction, and moves through a transparent status pipeline from submission to resolution." },
  { heading: "Investigation Workflow", body: "Assigned investigators review evidence, may request additional information, and document findings before a case is closed, escalated, or transferred to the appropriate authority." },
  { heading: "Organizational Structure", body: "Oversight is organized across Zone, Town Administration, District, and Office-level administrators, with a Super Admin tier providing national coordination and final escalation review." },
  { heading: "Ethics Principles", body: "Fairness, impartiality, and proportionality guide every stage of the complaint-handling process, regardless of who is involved." },
  { heading: "Transparency & Accountability", body: "Complainants can track the status of their case at any time, and every status change is logged in a permanent audit trail." },
  { heading: "Confidentiality Policy", body: "Anonymous complaints are accepted and investigated without requiring identifying information; identified complainants' personal details are only shared with staff directly handling their case." },
];

export default function EthicsAbout() {
  return (
    <AboutPage
      title="About the Ethics & Investigation Office"
      intro={[
        "Xafiiska Koomishinka Anshaxa & Baadhista Xisbiga Barwaaqo Laantiisa DDS is the office responsible for ethics oversight, investigations, and complaint resolution within Xisbiga Barwaaqo Laantiisa DDS.",
      ]}
      sections={SECTIONS}
    />
  );
}
