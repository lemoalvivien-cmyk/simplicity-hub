/**
 * PageTitle — Sets document.title on mount/update
 * Usage: <PageTitle title="Missions — WiinupMax" />
 */
import { useEffect } from "react";

interface Props { title: string; suffix?: boolean }

export default function PageTitle({ title, suffix = true }: Props) {
  useEffect(() => {
    document.title = suffix ? `${title} — WiinupMax` : title;
    return () => { document.title = "WiinupMax — Prospection B2B & Apport d'affaires par IA"; };
  }, [title, suffix]);
  return null;
}
