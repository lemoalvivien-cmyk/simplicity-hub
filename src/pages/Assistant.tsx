import { useState, useRef, useEffect } from "react";
import UserLayout from "@/components/layout/UserLayout";
import { Send, Bot, User, Loader2, RefreshCw } from "lucide-react";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const STARTER_QUESTIONS = [
  "Comment fonctionne mon abonnement ?",
  "Comment utiliser un code d'invitation ?",
  "Comment accéder à l'aide ?",
  "Comment modifier mon mot de passe ?",
];

const MOCK_RESPONSES: Record<string, string> = {
  default: "Je suis là pour vous aider ! Posez-moi n'importe quelle question sur Planify et je vous répondrai clairement. Si je ne sais pas, je vous orienterai vers notre équipe support.",
  abonnement: "Votre abonnement Premium vous donne accès à toutes les fonctionnalités de Planify. Vous pouvez le consulter, modifier ou annuler à tout moment depuis **Mon compte → Abonnement**. La résiliation est immédiate et sans condition.",
  code: "Le code d'invitation vous donne **12 mois d'accès gratuit**. Il s'utilise une seule fois au moment de l'activation. Si le vôtre ne fonctionne pas, contactez notre support — nous vérifierons ça pour vous.",
  aide: "Vous trouvez le centre d'aide en cliquant sur **Aide** dans le menu du haut. Vous y trouverez les réponses aux questions les plus courantes, et si ce n'est pas suffisant, vous pouvez me poser la question directement ici.",
  "mot de passe": "Pour changer votre mot de passe : allez dans **Mon compte**, puis cliquez sur **Modifier le mot de passe**. Vous recevrez un e-mail de confirmation.",
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("abonnement") || lower.includes("prix") || lower.includes("tarif")) return MOCK_RESPONSES.abonnement;
  if (lower.includes("code") || lower.includes("invitation")) return MOCK_RESPONSES.code;
  if (lower.includes("aide") || lower.includes("help")) return MOCK_RESPONSES.aide;
  if (lower.includes("mot de passe") || lower.includes("password")) return MOCK_RESPONSES["mot de passe"];
  return MOCK_RESPONSES.default;
}

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content: "Bonjour ! Je suis votre assistant Planify. Posez-moi n'importe quelle question, je suis là pour vous aider. 😊",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 900));

    const reply: Message = {
      id: Date.now() + 1,
      role: "assistant",
      content: getResponse(text),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, reply]);
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const reset = () => {
    setMessages([{
      id: 0,
      role: "assistant",
      content: "Bonjour ! Je suis votre assistant Planify. Posez-moi n'importe quelle question, je suis là pour vous aider. 😊",
      timestamp: new Date(),
    }]);
    setInput("");
  };

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Assistant IA</h1>
            <p className="text-sm text-muted-foreground">Je réponds à vos questions en quelques secondes.</p>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw size={14} />
            Nouvelle conversation
          </button>
        </div>

        {/* Chat container */}
        <div className="card-surface flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                }`}>
                  {msg.role === "assistant" ? <Bot size={15} /> : <User size={15} />}
                </div>
                <div
                  className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  }`}
                >
                  {msg.content.split("**").map((part, i) =>
                    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 flex-row">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <Bot size={15} />
                </div>
                <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Je cherche...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="btn-primary px-4 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
