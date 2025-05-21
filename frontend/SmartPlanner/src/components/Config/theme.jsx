import { useAppTheme } from "../../context/ThemeContext";
import ThemeManager from "./Config/ThemeManager";

export default function ThemeConfigPage() {
  const theme = useAppTheme();
  return <ThemeManager theme={theme} setTheme={theme} />;
}