"use client"

import type React from "react"
import { useEffect } from "react"

export function InitProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize demo data on first load
    const initialized = localStorage.getItem("initialized");

    if (!initialized) {
      console.log("Initializing demo data in localStorage...");
      const defaultUsers = [
        {
          id: "emp1",
          name: "Budi Santoso",
          email: "karyawan@example.com",
          password: "password123",
          role: "employee",
          department: "IT",
        },
        {
          id: "emp2",
          name: "Siti Nurhayati",
          email: "siti@example.com",
          password: "password123",
          role: "employee",
          department: "HR",
        },
        {
          id: "emp3",
          name: "Ahmad Wijaya",
          email: "ahmad@example.com",
          password: "password123",
          role: "employee",
          department: "Finance",
        },
        {
          id: "admin1",
          name: "Admin Sistem",
          email: "admin@example.com",
          password: "admin123",
          role: "admin",
          department: "Management",
        },
      ];

      localStorage.setItem("users", JSON.stringify(defaultUsers));
      localStorage.setItem("attendance", JSON.stringify([]));
      localStorage.setItem("initialized", "true");
      console.log("Demo data initialized.");
    }
  }, []);

  return <>{children}</>;
}
