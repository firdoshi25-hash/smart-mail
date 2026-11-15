import { useContext } from "react";
import MailContext from "../context/mailContext";

export default function useMail() {
  const context = useContext(MailContext);
  if (!context) throw new Error("useMail must be used within MailProvider");
  return context;
}
