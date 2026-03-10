import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Check, Rocket, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProspectionMessage {
  id: number;
  subject: string;
  body: string;
}

interface ProspectionModalProps {
  open: boolean;
  onClose: () => void;
  defaultCompanyName?: string;
  defaultSector?: string;
}

export default function ProspectionModal({
  open,
  onClose,
  defaultCompanyName = "",
  defaultSector = "",
}: ProspectionModalProps) {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState(defaultCompanyName);
  const [sector, setSector] = useState(defaultSector);
  const [targetDescription, setTargetDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ProspectionMessage[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!companyName.trim() || !sector.trim() || !targetDescription.trim()) {
      toast({ title: "Champs requis", description: "Remplissez tous les champs avant de générer.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setMessages([]);
    try {
      const { data, error } = await supabase.functions.invoke("ai-prospection", {
        body: {
          company_name: companyName.trim(),
          sector: sector.trim(),
          target_description: targetDescription.trim(),
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setMessages(data.messages || []);
    } catch (err) {
      toast({
        title: "Erreur de génération",
        description: err instanceof Error ? err.message : "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (msg: ProspectionMessage) => {
    const text = `Objet : ${msg.subject}\n\n${msg.body}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(msg.id);
    toast({ title: "Copié !", description: "Message copié dans le presse-papier." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClose = () => {
    setMessages([]);
    setTargetDescription("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Rocket size={15} className="text-white" />
            </div>
            Prospection IA — 3 messages personnalisés
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Form */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="company_name" className="text-xs font-semibold text-foreground">
                Votre entreprise
              </Label>
              <Input
                id="company_name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Acme SAS"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sector" className="text-xs font-semibold text-foreground">
                Secteur d'activité
              </Label>
              <Input
                id="sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="Ex: SaaS B2B, Industrie, Finance…"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="target" className="text-xs font-semibold text-foreground">
              Cible & contexte de prospection
            </Label>
            <Textarea
              id="target"
              value={targetDescription}
              onChange={(e) => setTargetDescription(e.target.value)}
              placeholder="Ex: Directeurs commerciaux de PME industrielles (50-500 salariés) cherchant à développer leur réseau en Afrique francophone…"
              className="min-h-[80px] resize-none"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
            style={{ background: "var(--gradient-primary)" }}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin mr-2" />
                Génération en cours…
              </>
            ) : (
              <>
                <Sparkles size={15} className="mr-2" />
                Générer 3 messages de prospection
              </>
            )}
          </Button>
        </div>

        {/* Generated messages */}
        {messages.length > 0 && (
          <div className="space-y-3 mt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {messages.length} messages générés
            </p>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-xl p-4 border space-y-2"
                style={{
                  background: "hsl(var(--secondary))",
                  borderColor: "hsl(var(--border))",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-0.5">
                      Message {msg.id}
                    </p>
                    <p className="text-sm font-semibold text-foreground leading-snug">
                      📧 {msg.subject}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(msg)}
                    className="shrink-0 h-8 px-3 text-xs"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check size={12} className="mr-1 text-success" /> Copié
                      </>
                    ) : (
                      <>
                        <Copy size={12} className="mr-1" /> Copier
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {msg.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
