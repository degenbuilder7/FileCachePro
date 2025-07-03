"use client";
import { useUser } from "@/context/userContext";
import { User, Miner } from "@/components/Dashboard";
import styles from "@/styles/dashboard.module.css";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

export default function Page() {
  const { user } = useUser();
  const { role, roleChoose } = user;
  const router = useRouter();

  useEffect(() => {
    if (!roleChoose) {
      router.replace("/");
    }
  }, [roleChoose, router]);

  // Don't render anything if role is not chosen
  if (!roleChoose) {
    return null;
  }

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        {role === "user" && <User />}
        {role === "miner" && <Miner />}
      </div>
      <Toaster
        toastOptions={{
          className: "toast",
        }}
      />
    </main>
  );
}
