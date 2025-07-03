import styles from "./index.module.css";
import Navigation from "../Header/components/Navigation";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        © 2025 VerifiAI. Built for Protocol Labs Genesis Hackathon 2025.
      </div>
    </footer>
  );
}
