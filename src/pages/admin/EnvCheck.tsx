// PROOF:CONTROL_PLANE_V2:envcheck_redirects_to_control_plane
/**
 * EnvCheck — Redirigé vers le Control Plane réel
 * Cette page est conservée pour compatibilité de route mais pointe
 * vers la source de vérité: le Control Plane avec checks runtime réels.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminEnvCheck() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect vers le control plane réel après 2s
    const t = setTimeout(() => navigate("/admin"), 2000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <AdminLayout title="Env Check" subtitle="Cette vue est remplacée par le Control Plane.">
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">
          Redirection vers le{" "}
          <a href="/admin" className="text-primary underline">Control Plane</a>{" "}
          avec vérification runtime réelle…
        </p>
        <p className="text-xs text-muted-foreground max-w-sm text-center">
          L'ancienne page EnvCheck utilisait des statuts statiques.
          Le Control Plane calcule désormais chaque capability depuis des signaux réels
          avec preuves horodatées.
        </p>
      </div>
    </AdminLayout>
  );
}
