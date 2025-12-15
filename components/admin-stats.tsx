"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Users, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

interface AttendanceRecord {
  id: string
  user_id: string
  type: "check-in" | "check-out"
  timestamp: string
}

interface User {
  id: string
  email: string
  role: "employee" | "admin"
}

export default function AdminStats() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    notCheckedIn: 0,
  })
  const [loading, setLoading] = useState(true)

      useEffect(() => {

        const fetchStats = async () => {

          // setLoading(true) // Optional: remove for silent refresh

          try {

            const { data: { session } } = await supabase.auth.getSession()

            if (!session) throw new Error("Not authenticated")

    

            const [usersResponse, attendanceResponse] = await Promise.all([

              fetch('/api/users', { headers: { Authorization: `Bearer ${session.access_token}` } }),

              fetch('/api/attendance', { headers: { Authorization: `Bearer ${session.access_token}` } }),

            ]);

    

            if (!usersResponse.ok) {

              throw new Error(`Gagal memuat data pengguna: ${usersResponse.statusText}`);

            }

            

            // Handle case where attendance is empty (404) but users are loaded

            if (attendanceResponse.status === 404) {

                const users: User[] = await usersResponse.json();

                const employees = users.filter((u) => u.role === "employee");

                setStats({

                  totalEmployees: employees.length,

                  presentToday: 0,

                  notCheckedIn: employees.length,

                });

                setLoading(false);

                return;

            }

    

            if (!attendanceResponse.ok) {

              throw new Error(`Gagal memuat data absensi: ${attendanceResponse.statusText}`);

            }

            

            const users: User[] = await usersResponse.json()

            const attendance: AttendanceRecord[] = await attendanceResponse.json()

    

            const employees = users.filter((u) => u.role === "employee")

            const today = new Date().toDateString()

    

            const todayAttendance = attendance.filter(

              (record) => new Date(record.timestamp).toDateString() === today,

            )

    

            const checkedInToday = new Set(

              todayAttendance.filter((r) => r.type === "check-in").map((r) => r.user_id),

            )

    

            setStats({

              totalEmployees: employees.length,

              presentToday: checkedInToday.size,

              notCheckedIn: employees.length - checkedInToday.size,

            })

          } catch (error) {

            console.error("Error fetching admin stats:", error)

          } finally {

            setLoading(false)

          }

        }

    

        fetchStats() // Initial fetch

    

        // Set up real-time subscription

        const channel = supabase

          .channel('attendance-changes')

          .on(

            'postgres_changes',

            { event: 'INSERT', schema: 'public', table: 'attendance' },

            (payload) => {

              console.log('Perubahan terdeteksi di tabel absensi!', payload)

              fetchStats() // Refetch stats on new insert

            }

          )

          .subscribe()

    

        // Cleanup subscription on component unmount

        return () => {

          supabase.removeChannel(channel)

        }

      }, [])

  const statCards = [
    {
      title: "Total Peserta Magang",
      value: stats.totalEmployees,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Hadir Hari Ini",
      value: stats.presentToday,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Belum Absen Masuk",
      value: stats.notCheckedIn,
      icon: AlertCircle,
      color: "bg-red-500",
    },
  ]
  
  if (loading) {
      return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map((stat, index) => (
                   <Card key={index} className="bg-white shadow-lg overflow-hidden">
                       <div className="p-6">
                           <div className="flex items-center justify-between mb-4">
                                <div className={`${stat.color} rounded-lg p-3`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                           </div>
                           <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
                           <div className="mt-2">
                               <Loader2 className="w-8 h-8 text-gray-200 animate-spin"/>
                           </div>
                       </div>
                   </Card>
              ))}
          </div>
      )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="bg-white shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
