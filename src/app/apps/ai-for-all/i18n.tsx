"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "en" | "ml";

const t = {
  // ── Navbar ──
  "nav.pandaApps": { en: "Panda Apps", ml: "പാണ്ട ആപ്സ്" },
  "nav.sessions": { en: "Sessions", ml: "സെഷനുകൾ" },
  "nav.vote": { en: "Vote", ml: "വോട്ട്" },
  "nav.about": { en: "About", ml: "ഞങ്ങളെ കുറിച്ച്" },
  "nav.learnGrowLead": { en: "Learn · Grow · Lead", ml: "പഠിക്കൂ · വളരൂ · നയിക്കൂ" },

  // ── Hero ──
  "hero.ai": { en: "AI", ml: "AI" },
  "hero.forEveryone": { en: "for Everyone.", ml: "എല്ലാവർക്കും." },
  "hero.subtitle": {
    en: "Hands-on online sessions to upskill {anyone} with AI tools — image creation, poster design, video generation, and more. A small fee that goes {entirely} to those in need.",
    ml: "AI ടൂളുകൾ ഉപയോഗിച്ച് {anyone} നെ നൈപുണ്യമുള്ളവരാക്കാനുള്ള പ്രായോഗിക ഓൺലൈൻ സെഷനുകൾ — ഇമേജ് ക്രിയേഷൻ, പോസ്റ്റർ ഡിസൈൻ, വീഡിയോ ജനറേഷൻ, മറ്റും. ഒരു ചെറിയ ഫീ {entirely} ആവശ്യക്കാർക്ക് പോകുന്നു.",
  },
  "hero.anyone": { en: "anyone", ml: "ആരെയും" },
  "hero.entirely": { en: "entirely", ml: "പൂർണ്ണമായും" },
  "hero.registerNext": { en: "Register for Next Session", ml: "അടുത്ത സെഷനിൽ രജിസ്റ്റർ ചെയ്യൂ" },
  "hero.viewSessions": { en: "View Sessions", ml: "സെഷനുകൾ കാണുക" },
  "hero.voteTopics": { en: "Vote on Topics", ml: "വിഷയങ്ങൾക്ക് വോട്ട് ചെയ്യൂ" },
  "hero.next": { en: "Next", ml: "അടുത്തത്" },

  // ── Sessions ──
  "sessions.eyebrow": { en: "Upcoming Sessions", ml: "വരാനിരിക്കുന്ന സെഷനുകൾ" },
  "sessions.heading": { en: "Join the next", ml: "അടുത്ത" },
  "sessions.headingHighlight": { en: "live session", ml: "ലൈവ് സെഷനിൽ" },
  "sessions.headingSuffix": { en: "", ml: "ചേരൂ" },
  "sessions.subtitle": {
    en: "Hands-on AI training open to everyone. Practical, simple, and impactful.",
    ml: "എല്ലാവർക്കും ലഭ്യമായ പ്രായോഗിക AI പരിശീലനം. ലളിതവും ഫലപ്രദവുമായ.",
  },
  "sessions.regOpen": { en: "Registration Open", ml: "രജിസ്ട്രേഷൻ തുറന്നു" },
  "sessions.closed": { en: "Closed", ml: "അടച്ചു" },
  "sessions.seats": { en: "seats", ml: "സീറ്റുകൾ" },
  "sessions.dateTba": { en: "Date TBA", ml: "തീയതി അറിയിക്കും" },
  "sessions.min": { en: "min", ml: "മിനിറ്റ്" },
  "sessions.registerNow": { en: "Register Now", ml: "ഇപ്പോൾ രജിസ്റ്റർ ചെയ്യൂ" },
  "sessions.regClosed": { en: "Registration Closed", ml: "രജിസ്ട്രേഷൻ അടച്ചു" },
  "sessions.launchingSoon": { en: "Sessions launching soon", ml: "സെഷനുകൾ ഉടൻ ആരംഭിക്കും" },
  "sessions.noSessions": {
    en: "No sessions scheduled yet. Vote on the topics you'd love to learn — we'll plan sessions based on community interest!",
    ml: "ഇതുവരെ സെഷനുകൾ ഷെഡ്യൂൾ ചെയ്തിട്ടില്ല. നിങ്ങൾ പഠിക്കാൻ ആഗ്രഹിക്കുന്ന വിഷയങ്ങൾക്ക് വോട്ട് ചെയ്യൂ — കമ്മ്യൂണിറ്റി താൽപ്പര്യത്തിന്റെ അടിസ്ഥാനത്തിൽ ഞങ്ങൾ സെഷനുകൾ പ്ലാൻ ചെയ്യും!",
  },

  // ── Voting ──
  "vote.eyebrow": { en: "Community Vote", ml: "കമ്മ്യൂണിറ്റി വോട്ട്" },
  "vote.heading": { en: "Shape what we", ml: "ഞങ്ങൾ അടുത്ത്" },
  "vote.headingHighlight": { en: "teach next", ml: "പഠിപ്പിക്കുന്നത്" },
  "vote.headingSuffix": { en: "", ml: "രൂപപ്പെടുത്തൂ" },
  "vote.subtitle": {
    en: "Vote for the topics you'd love to see in upcoming sessions. Your votes directly shape what we build.",
    ml: "വരാനിരിക്കുന്ന സെഷനുകളിൽ കാണാൻ നിങ്ങൾ ആഗ്രഹിക്കുന്ന വിഷയങ്ങൾക്ക് വോട്ട് ചെയ്യൂ. നിങ്ങളുടെ വോട്ടുകൾ ഞങ്ങൾ നിർമ്മിക്കുന്നതിനെ നേരിട്ട് രൂപപ്പെടുത്തുന്നു.",
  },
  "vote.totalVotes": { en: "community votes cast", ml: "കമ്മ്യൂണിറ്റി വോട്ടുകൾ" },
  "vote.voteFor": { en: "Vote for this", ml: "ഇതിന് വോട്ട് ചെയ്യൂ" },
  "vote.voted": { en: "Voted! (Click to undo)", ml: "വോട്ട് ചെയ്തു! (മാറ്റാൻ ക്ലിക്ക് ചെയ്യൂ)" },
  "vote.votes": { en: "votes", ml: "വോട്ടുകൾ" },
  "vote.vote": { en: "vote", ml: "വോട്ട്" },
  "vote.suggestTitle": { en: "Got an idea? Suggest a topic", ml: "ഒരു ആശയം ഉണ്ടോ? ഒരു വിഷയം നിർദ്ദേശിക്കൂ" },
  "vote.suggestSub": {
    en: "Submit your own — once approved, it joins the vote",
    ml: "നിങ്ങളുടെ സ്വന്തം സമർപ്പിക്കൂ — അംഗീകരിച്ചാൽ, അത് വോട്ടിൽ ചേരും",
  },
  "vote.topicName": { en: "Topic Name", ml: "വിഷയത്തിന്റെ പേര്" },
  "vote.description": { en: "Description (optional)", ml: "വിവരണം (ഐച്ഛികം)" },
  "vote.yourName": { en: "Your Name (optional)", ml: "നിങ്ങളുടെ പേര് (ഐച്ഛികം)" },
  "vote.submit": { en: "Submit Suggestion", ml: "നിർദ്ദേശം സമർപ്പിക്കൂ" },
  "vote.topicPlaceholder": { en: "e.g. AI for Malayalam Typing", ml: "ഉദാ. മലയാളം ടൈപ്പിംഗിനുള്ള AI" },
  "vote.descPlaceholder": { en: "Briefly describe what you'd like to learn...", ml: "നിങ്ങൾ എന്ത് പഠിക്കാൻ ആഗ്രഹിക്കുന്നു എന്ന് ചുരുക്കി വിവരിക്കൂ..." },
  "vote.namePlaceholder": { en: "Anonymous", ml: "അജ്ഞാതം" },
  "vote.thankyou": { en: "Thank you! 💜", ml: "നന്ദി! 💜" },
  "vote.underReview": {
    en: "Your idea is under review. Once approved, it will appear in the voting list above.",
    ml: "നിങ്ങളുടെ ആശയം അവലോകനത്തിലാണ്. അംഗീകരിച്ചാൽ, അത് മുകളിലുള്ള വോട്ടിംഗ് ലിസ്റ്റിൽ ദൃശ്യമാകും.",
  },

  // ── About ──
  "about.eyebrow": { en: "Our Mission", ml: "ഞങ്ങളുടെ ദൗത്യം" },
  "about.heading": { en: "Why", ml: "എന്തുകൊണ്ട്" },
  "about.headingEnd": { en: "?", ml: "?" },
  "about.subtitle": {
    en: "Knowledge should not be a privilege — {highlight}",
    ml: "അറിവ് ഒരു പ്രത്യേക അവകാശമായിരിക്കരുത് — {highlight}",
  },
  "about.subtitleHighlight": {
    en: "it should be accessible to everyone.",
    ml: "അത് എല്ലാവർക്കും ലഭ്യമായിരിക്കണം.",
  },

  "about.quote": {
    en: "AI competency is not a luxury. {highlight} — and everyone deserves it.",
    ml: "AI കഴിവ് ഒരു ആഡംബരമല്ല. {highlight} — എല്ലാവരും അതിന് അർഹരാണ്.",
  },
  "about.quoteHighlight": {
    en: "It's the next basic skill",
    ml: "ഇത് അടുത്ത അടിസ്ഥാന കഴിവാണ്",
  },
  "about.quoteAuthor": { en: "— The AI for All Initiative", ml: "— AI ഫോർ ആൾ ഇനിഷ്യേറ്റീവ്" },

  "about.pillar1Title": { en: "No One Left Behind", ml: "ആരെയും ഉപേക്ഷിക്കരുത്" },
  "about.pillar1Body": {
    en: "AI is reshaping every profession. Our mission: ensure everyone—regardless of location, background, or profession—has access to AI skills.",
    ml: "AI എല്ലാ തൊഴിലുകളെയും പുനർരൂപകല്പന ചെയ്യുന്നു. ഞങ്ങളുടെ ദൗത്യം: സ്ഥലം, പശ്ചാത്തലം, അല്ലെങ്കിൽ തൊഴിൽ പരിഗണിക്കാതെ എല്ലാവർക്കും AI കഴിവുകൾ ലഭ്യമാക്കുക.",
  },
  "about.pillar2Title": { en: "Fee Goes to the Needy", ml: "ഫീ ആവശ്യക്കാർക്ക്" },
  "about.pillar2Body": {
    en: "A small course fee is collected, but not a single rupee is kept by the instructor. Every payment is donated directly to verified NGOs.",
    ml: "ഒരു ചെറിയ കോഴ്സ് ഫീ ശേഖരിക്കുന്നു, പക്ഷേ ഒരു രൂപ പോലും അധ്യാപകൻ എടുക്കുന്നില്ല. ഓരോ പേയ്മെന്റും സ്ഥിരീകരിച്ച NGO-കൾക്ക് നേരിട്ട് സംഭാവന ചെയ്യുന്നു.",
  },
  "about.pillar3Title": { en: "Practical & Simple", ml: "പ്രായോഗികവും ലളിതവും" },
  "about.pillar3Body": {
    en: "Sessions are designed for anyone with zero technical background. If you can use WhatsApp, you can use AI tools.",
    ml: "ടെക്‌നിക്കൽ പശ്ചാത്തലമില്ലാത്ത ആർക്കും വേണ്ടി ഡിസൈൻ ചെയ്ത സെഷനുകൾ. WhatsApp ഉപയോഗിക്കാൻ അറിയാമെങ്കിൽ, AI ടൂളുകൾ ഉപയോഗിക്കാം.",
  },
  "about.pillar4Title": { en: "Hands-On Learning", ml: "പ്രായോഗിക പഠനം" },
  "about.pillar4Body": {
    en: "No boring theory. Every session is practical—you create real outputs: images, posters, worksheets, or videos by the end.",
    ml: "വിരസമായ തിയറി ഇല്ല. ഓരോ സെഷനും പ്രായോഗികം — അവസാനം നിങ്ങൾ യഥാർത്ഥ ഔട്ട്‌പുട്ടുകൾ സൃഷ്ടിക്കും: ഇമേജുകൾ, പോസ്റ്ററുകൾ, വർക്ക്‌ഷീറ്റുകൾ, അല്ലെങ്കിൽ വീഡിയോകൾ.",
  },
  "about.donationTitle": { en: "100% Transparent Donations", ml: "100% സുതാര്യ സംഭാവനകൾ" },
  "about.donationBody": {
    en: "When you pay the course fee, you donate {directly} to a verified NGO. You receive the donation receipt. The instructor keeps nothing. Radical transparency.",
    ml: "നിങ്ങൾ കോഴ്സ് ഫീ അടയ്ക്കുമ്പോൾ, ഒരു സ്ഥിരീകരിച്ച NGO-യ്ക്ക് {directly} സംഭാവന ചെയ്യുന്നു. സംഭാവന രസീത് നിങ്ങൾക്ക് ലഭിക്കും. അധ്യാപകൻ ഒന്നും എടുക്കുന്നില്ല. സമ്പൂർണ്ണ സുതാര്യത.",
  },
  "about.directly": { en: "directly", ml: "നേരിട്ട്" },

  // ── Footer ──
  "footer.tagline": {
    en: "Made with 💜 for everyone who believes knowledge should be free, fair, and accessible.",
    ml: "അറിവ് സ്വതന്ത്രവും, നീതിയുക്തവും, എല്ലാവർക്കും ലഭ്യവുമായിരിക്കണമെന്ന് വിശ്വസിക്കുന്ന എല്ലാവർക്കും 💜 ഉപയോഗിച്ച് നിർമ്മിച്ചത്.",
  },
  "footer.initiative": { en: "An initiative of Panda Apps", ml: "പാണ്ട ആപ്സിന്റെ ഒരു സംരംഭം" },
  "footer.admin": { en: "Admin", ml: "അഡ്മിൻ" },
} as const;

export type TransKey = keyof typeof t;

// ── Context ──
const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: (key: TransKey) => string;
}>({
  lang: "en",
  setLang: () => {},
  tr: (key) => t[key]?.en ?? key,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("ai4all_lang") as Lang | null;
    if (saved && (saved === "en" || saved === "ml")) setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("ai4all_lang", l);
  }

  function tr(key: TransKey): string {
    return t[key]?.[lang] ?? t[key]?.en ?? key;
  }

  return (
    <LangContext.Provider value={{ lang, setLang, tr }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
