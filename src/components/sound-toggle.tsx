import { useSyncExternalStore } from "react";
import { SpeakerOffIcon, SpeakerOnIcon } from "@/components/icons";
import { isSoundEnabled, setSoundEnabled, subscribeSound } from "@/utils/sound";

const getServerSnapshot = () => false;

export default function SoundToggle({ className }: { className?: string }) {
  const enabled = useSyncExternalStore(
    subscribeSound,
    isSoundEnabled,
    getServerSnapshot,
  );

  return (
    <button
      type="button"
      aria-pressed={enabled}
      aria-label={enabled ? "mute click sounds" : "enable click sounds"}
      title={enabled ? "sound on" : "sound off"}
      onClick={() => setSoundEnabled(!enabled)}
      className={className}
    >
      {enabled ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
    </button>
  );
}
