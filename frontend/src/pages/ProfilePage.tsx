import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { Mail, Shield, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-lg space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Account details</p>
      </div>
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="font-display">Your account</CardTitle>
          <CardDescription>Signed in as {user?.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4 rounded-lg border border-border/60 bg-muted/20 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-2 font-medium">
                <User className="h-4 w-4 text-muted-foreground" />
                {user?.name}
              </p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {user?.email}
              </p>
              <p className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{user?.role}</span>
                {user?.is_blocked && <span className="text-red-400">(blocked)</span>}
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
