import { requireOptionalNativeModule } from "expo-modules-core";

import type { ThemeMode } from "../storage/preferences";

type AlternateAppIconsModule = {
  supportsAlternateIcons: boolean;
  getAppIconName: () => string | null;
  setAlternateAppIcon: (name: string | null) => Promise<string | null>;
};

const alternateAppIcons =
  requireOptionalNativeModule<AlternateAppIconsModule>(
    "ExpoAlternateAppIcons",
  );

const ICON_FOR_THEME: Record<ThemeMode, string | null> = {
  light: null,
  dark: "Dark",
  archive: "Archive",
};

/** Keeps the Home Screen icon aligned with the theme selected inside ECHO. */
export async function syncAppIconWithTheme(theme: ThemeMode): Promise<void> {
  if (!alternateAppIcons?.supportsAlternateIcons) {
    return;
  }

  const requestedIcon = ICON_FOR_THEME[theme];

  if (alternateAppIcons.getAppIconName() === requestedIcon) {
    return;
  }

  await alternateAppIcons.setAlternateAppIcon(requestedIcon);
}
