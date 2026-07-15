import { useDispatch, useSelector } from "react-redux";
import { selectTheme, toggleTheme } from "../app/themeSlice";

export function useTheme() {
  const mode = useSelector(selectTheme);
  const dispatch = useDispatch();
  return { mode, toggle: () => dispatch(toggleTheme()) };
}
