import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const sections = [
  {
    title: "1. Introduction",
    content: `TasksMate respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our platform.`
  },
  {
    title: "2. What we collect",
    content: `• Account data (name, email, organisation)\n• Content you create or upload (tasks, comments, attachments)\n• Usage data (feature interactions, device information)\n• Cookies and similar technologies for authentication & analytics`
  },
  {
    title: "3. How we use your data",
    content: `• Provide and maintain the service\n• Personalise your workspace\n• Improve and develop new features\n• Communicate important updates\n• Detect, prevent, and address technical issues`
  },
  {
    title: "4. Sharing & disclosure",
    content: `We never sell your data. We only share information with:\n• Service providers under strict confidentiality agreements\n• Authorities when required by law\n• Others with your explicit consent`
  },
  {
    title: "5. Data retention",
    content: `We keep your information only as long as necessary to fulfil the purposes outlined in this policy, unless a longer retention period is required or permitted by law.`
  },
  {
    title: "6. Your rights",
    content: `Depending on your location, you may have rights to access, correct, delete, or restrict the use of your personal data. Contact us at privacy@tasksmate.app to exercise your rights.`
  },
  {
    title: "7. Security",
    content: `We implement industry-standard technical and organisational measures — including encryption in transit and at rest — to protect your information.`
  },
  {
    title: "8. Changes to this policy",
    content: `We may update this policy from time to time. We will notify you of any material changes by prominently posting a notice on our website or within the app.`
  },
  {
    title: "9. Contact us",
    content: `If you have questions about this policy, reach out at privacy@tasksmate.app.`
  }
];

const Privacy = () => (
  <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 py-16 px-6">
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="space-y-4 text-center">
        <div className="inline-flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-tasksmate-gradient flex items-center justify-center">
            <Check className="h-4 w-4 text-white" />
          </div>
          <h1 className="font-sora font-bold text-3xl">TasksMate Privacy Policy</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Your trust is our top priority. Below you can learn exactly how we handle and safeguard your data.
        </p>
      </header>

      {sections.map((sec, idx) => (
        <section key={idx} className="space-y-3">
          <h2 className="font-semibold text-xl text-tasksmate-green-end">{sec.title}</h2>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{sec.content}</p>
        </section>
      ))}

      <div className="text-center pt-10">
        <Link to="/index" className="text-tasksmate-green-end hover:underline">
          ← Back to home
        </Link>
      </div>
    </div>
  </div>
);

export default Privacy;
