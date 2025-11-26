export function initDemoData() {
  const users = localStorage.getItem("users")

  if (!users) {
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
    ]

    localStorage.setItem("users", JSON.stringify(defaultUsers))
  }
}
