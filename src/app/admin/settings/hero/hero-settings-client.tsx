"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Save, Trash, Film } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeroSettingsClientProps {
  initialDesktop: string;
  initialMobile: string;
}

export default function HeroSettingsClient({
  initialDesktop,
  initialMobile,
}: HeroSettingsClientProps) {
  const router = useRouter();
  const [desktopMedia, setDesktopMedia] = useState(initialDesktop);
  const [mobileMedia, setMobileMedia] = useState(initialMobile);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [saving, setSaving] = useState(false);

  function isVideoUrl(url: string) {
    if (!url) return false;
    const extension = url.split("?")[0].split(".").pop()?.toLowerCase();
    return ["mp4", "mov", "webm", "ogg", "quicktime"].includes(extension || "") || url.includes("/video/upload/");
  }

  async function handleUpload(file: File, type: "desktop" | "mobile") {
    const isDesktop = type === "desktop";
    if (isDesktop) setUploadingDesktop(true);
    else setUploadingMobile(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "el-huyaam/hero");

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "L'upload a échoué");

      if (isDesktop) {
        setDesktopMedia(data.data.url);
      } else {
        setMobileMedia(data.data.url);
      }
      toast.success("Média importé avec succès !");
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de l'import");
    } finally {
      if (isDesktop) setUploadingDesktop(false);
      else setUploadingMobile(false);
    }
  }

  async function handleSave() {
    if (!desktopMedia.trim() || !mobileMedia.trim()) {
      toast.error("Veuillez spécifier les chemins des deux médias");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/hero-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desktopMedia,
          mobileMedia,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Une erreur est survenue");

      toast.success("Configuration Hero sauvegardée !");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Settings Card */}
      <div className="bg-white border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="font-display text-base text-gray-900 mb-1">Médias de la Hero Section</h2>
          <p className="text-xs text-gray-400">
            Importez des fichiers ou renseignez directement des chemins d'accès locaux.
          </p>
        </div>

        <div className="space-y-8">
          {/* Desktop Media Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">
                1. Version Web / Desktop
              </label>
              <p className="text-xs text-gray-400">
                S'affiche sur les grands écrans. Formats suggérés : Photo paysagée HD ou Vidéo large.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 items-start">
              {/* Preview Box */}
              <div className="aspect-video bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden relative group">
                {desktopMedia ? (
                  <>
                    {isVideoUrl(desktopMedia) ? (
                      <video src={desktopMedia} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={desktopMedia} alt="Desktop Hero" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => setDesktopMedia("")}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                    {isVideoUrl(desktopMedia) && (
                      <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm flex items-center gap-1.5 font-medium">
                        <Film className="w-3 h-3" /> Vidéo
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-gray-400 italic">Aucun média</span>
                )}
              </div>

              {/* Upload & Path fields */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex gap-2">
                  <Input
                    label="Chemin d'accès / URL"
                    placeholder="/hero-mobile.png"
                    value={desktopMedia}
                    onChange={(e: any) => setDesktopMedia(e.target.value)}
                    className="font-mono w-full"
                  />
                </div>
                <div>
                  <input
                    type="file"
                    id="desktop-file-input"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "desktop");
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full py-5 text-xs font-medium uppercase tracking-widest gap-2"
                    onClick={() => document.getElementById("desktop-file-input")?.click()}
                    disabled={uploadingDesktop}
                  >
                    {uploadingDesktop ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <ImagePlus className="w-4 h-4" />
                        Choisir une Photo / Vidéo Web
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Mobile Media Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">
                2. Version Mobile / Téléphone
              </label>
              <p className="text-xs text-gray-400">
                S'affiche sur les smartphones. Formats suggérés : Vidéo portrait ou Photo verticale.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 items-start">
              {/* Preview Box */}
              <div className="aspect-[9/16] max-w-[180px] mx-auto bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden relative group">
                {mobileMedia ? (
                  <>
                    {isVideoUrl(mobileMedia) ? (
                      <video src={mobileMedia} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mobileMedia} alt="Mobile Hero" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => setMobileMedia("")}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                    {isVideoUrl(mobileMedia) && (
                      <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm flex items-center gap-1.5 font-medium">
                        <Film className="w-3 h-3" /> Vidéo
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-gray-400 italic">Aucun média</span>
                )}
              </div>

              {/* Upload & Path fields */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex gap-2">
                  <Input
                    label="Chemin d'accès / URL"
                    placeholder="/IMG_2121.MOV"
                    value={mobileMedia}
                    onChange={(e: any) => setMobileMedia(e.target.value)}
                    className="font-mono w-full"
                  />
                </div>
                <div>
                  <input
                    type="file"
                    id="mobile-file-input"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "mobile");
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full py-5 text-xs font-medium uppercase tracking-widest gap-2"
                    onClick={() => document.getElementById("mobile-file-input")?.click()}
                    disabled={uploadingMobile}
                  >
                    {uploadingMobile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <ImagePlus className="w-4 h-4" />
                        Choisir une Photo / Vidéo Mobile
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-gray-200 flex justify-end">
            <Button
              onClick={handleSave}
              className="px-8 py-5 text-xs uppercase tracking-widest font-semibold gap-2"
              variant="luxury"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Sauvegarder les configurations
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
