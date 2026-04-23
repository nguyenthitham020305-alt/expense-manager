import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { cn } from "@/lib/format";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  User, Mail, Phone, Calendar, FileText, Camera, Save,
  Bell, Shield, Palette, Globe, ChevronRight, Check,
  Lock, Eye, EyeOff, Trash2,
} from "lucide-react";

const STORAGE_KEY = "finova_user_profile";

interface UserProfile {
  fullName: string;
  displayName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  bio: string;
  avatar: string;
}

const defaultProfile: UserProfile = {
  fullName: "",
  displayName: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  address: "",
  bio: "",
  avatar: "",
};

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile;
  } catch {
    return defaultProfile;
  }
}

type SectionId = "profile" | "notifications" | "security" | "appearance";

const sidebarSections: { id: SectionId; label: string; icon: typeof User; desc: string }[] = [
  { id: "profile", label: "Thông tin cá nhân", icon: User, desc: "Họ tên, liên hệ, ảnh đại diện" },
  { id: "notifications", label: "Thông báo", icon: Bell, desc: "Cài đặt cảnh báo và nhắc nhở" },
  { id: "security", label: "Bảo mật", icon: Shield, desc: "Mật khẩu và xác thực" },
  { id: "appearance", label: "Giao diện", icon: Palette, desc: "Màu sắc và bố cục" },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Ảnh quá lớn", description: "Vui lòng chọn ảnh dưới 2MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfile(p => ({ ...p, avatar: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    toast({ title: "Đã lưu thành công", description: "Thông tin cá nhân đã được cập nhật." });
  };

  const initials = profile.fullName
    ? profile.fullName.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase()
    : "U";

  return (
    <Layout title="Cài đặt">
      <div className="flex flex-col lg:flex-row gap-6 max-w-5xl mx-auto">
        {/* Left sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Mini profile */}
            <div className="p-5 border-b border-border/50 flex items-center gap-3">
              <div className="relative">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="avatar"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                    <span className="text-base font-bold text-primary">{initials}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {profile.displayName || profile.fullName || "Người dùng"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{profile.email || "Chưa có email"}</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="p-2">
              {sidebarSections.map((s) => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group",
                    activeSection === s.id
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                  <s.icon className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{s.label}</p>
                    <p className={cn("text-[11px] leading-tight truncate",
                      activeSection === s.id ? "text-primary-foreground/70" : "text-muted-foreground/70"
                    )}>{s.desc}</p>
                  </div>
                  <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 transition-transform",
                    activeSection === s.id ? "text-primary-foreground" : "opacity-0 group-hover:opacity-100")} />
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <motion.div key={activeSection} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}>

            {/* ─── PROFILE SECTION ─── */}
            {activeSection === "profile" && (
              <div className="space-y-5">
                {/* Avatar card */}
                <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
                  <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider text-muted-foreground">Ảnh đại diện</h3>
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="avatar"
                          className="w-24 h-24 rounded-2xl object-cover ring-4 ring-border" />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-4 ring-border">
                          <span className="text-3xl font-bold text-primary">{initials}</span>
                        </div>
                      )}
                      <button onClick={() => fileRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors">
                        <Camera className="w-4 h-4 text-primary-foreground" />
                      </button>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Tải ảnh đại diện</p>
                      <p className="text-xs text-muted-foreground mb-3">JPG, PNG hoặc GIF. Tối đa 2MB.</p>
                      <div className="flex gap-2">
                        <button onClick={() => fileRef.current?.click()}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          Chọn ảnh
                        </button>
                        {profile.avatar && (
                          <button onClick={() => setProfile(p => ({ ...p, avatar: "" }))}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal info */}
                <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-5">Thông tin cá nhân</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field icon={User} label="Họ và tên đầy đủ" required
                      value={profile.fullName} onChange={v => setProfile(p => ({ ...p, fullName: v }))}
                      placeholder="Nguyễn Văn A" />
                    <Field icon={User} label="Tên hiển thị"
                      value={profile.displayName} onChange={v => setProfile(p => ({ ...p, displayName: v }))}
                      placeholder="Tên hiển thị trong ứng dụng" />
                    <Field icon={Mail} label="Email" type="email"
                      value={profile.email} onChange={v => setProfile(p => ({ ...p, email: v }))}
                      placeholder="example@email.com" />
                    <Field icon={Phone} label="Số điện thoại" type="tel"
                      value={profile.phone} onChange={v => setProfile(p => ({ ...p, phone: v }))}
                      placeholder="0901 234 567" />
                    <Field icon={Calendar} label="Ngày sinh" type="date"
                      value={profile.dob} onChange={v => setProfile(p => ({ ...p, dob: v }))}
                      placeholder="" />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Giới tính</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select value={profile.gender}
                          onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none">
                          <option value="">Chọn giới tính</option>
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                          <option value="prefer_not">Không muốn nói</option>
                        </select>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <Field icon={Globe} label="Địa chỉ"
                        value={profile.address} onChange={v => setProfile(p => ({ ...p, address: v }))}
                        placeholder="Số nhà, đường, phường, quận, tỉnh/thành phố" />
                    </div>
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Giới thiệu bản thân
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <textarea
                          value={profile.bio}
                          onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                          rows={3}
                          placeholder="Một vài dòng về bạn..."
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground/50" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex justify-end">
                  <button onClick={handleSave} disabled={saving}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm",
                      saved
                        ? "bg-emerald-500 text-white"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20",
                      saving && "opacity-70 cursor-not-allowed"
                    )}>
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : saved ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? "Đang lưu..." : saved ? "Đã lưu!" : "Lưu thay đổi"}
                  </button>
                </div>
              </div>
            )}

            {/* ─── NOTIFICATIONS SECTION ─── */}
            {activeSection === "notifications" && (
              <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 space-y-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Cài đặt thông báo</h3>
                {[
                  { label: "Cảnh báo vượt ngân sách", desc: "Thông báo khi chi tiêu đạt 80% ngân sách" },
                  { label: "Nhắc nhở giao dịch định kỳ", desc: "Nhắc nhở khi đến hạn các khoản cố định" },
                  { label: "Tóm tắt tháng", desc: "Báo cáo thu chi tổng hợp cuối mỗi tháng" },
                  { label: "Đạt mục tiêu tiết kiệm", desc: "Thông báo khi đạt được mục tiêu tiết kiệm" },
                  { label: "Tỷ lệ tiết kiệm thấp", desc: "Cảnh báo khi tỷ lệ tiết kiệm dưới 10%" },
                ].map((item, i) => (
                  <ToggleRow key={i} label={item.label} desc={item.desc} defaultValue={i < 3} />
                ))}
              </div>
            )}

            {/* ─── SECURITY SECTION ─── */}
            {activeSection === "security" && (
              <div className="space-y-5">
                <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-5">Đổi mật khẩu</h3>
                  <div className="space-y-4 max-w-sm">
                    {[
                      { label: "Mật khẩu hiện tại", placeholder: "Nhập mật khẩu hiện tại" },
                      { label: "Mật khẩu mới", placeholder: "Ít nhất 8 ký tự" },
                      { label: "Xác nhận mật khẩu mới", placeholder: "Nhập lại mật khẩu mới" },
                    ].map((f, i) => (
                      <div key={i} className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{f.label}</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input type={showPassword ? "text" : "password"} placeholder={f.placeholder}
                            className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50" />
                          {i === 1 && (
                            <button type="button" onClick={() => setShowPassword(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => toast({ title: "Tính năng sắp có", description: "Chức năng đổi mật khẩu sẽ được thêm sớm." })}
                      className="mt-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Cập nhật mật khẩu
                    </button>
                  </div>
                </div>
                <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Bảo mật tài khoản</h3>
                  {[
                    { label: "Xác thực 2 bước (2FA)", desc: "Thêm lớp bảo mật khi đăng nhập" },
                    { label: "Đăng xuất thiết bị khác", desc: "Kết thúc tất cả phiên đăng nhập khác" },
                  ].map((item, i) => (
                    <ToggleRow key={i} label={item.label} desc={item.desc} defaultValue={false} />
                  ))}
                </div>
              </div>
            )}

            {/* ─── APPEARANCE SECTION ─── */}
            {activeSection === "appearance" && (
              <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Giao diện & Hiển thị</h3>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">Chủ đề màu sắc</p>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { label: "Sáng", value: "light", color: "bg-white border-2" },
                      { label: "Tối", value: "dark", color: "bg-gray-900 border-2" },
                      { label: "Hệ thống", value: "system", color: "bg-gradient-to-r from-white to-gray-900 border-2" },
                    ].map((t) => (
                      <label key={t.value} className="cursor-pointer flex flex-col items-center gap-2 group">
                        <div className={cn("w-16 h-10 rounded-xl border-border group-hover:border-primary transition-colors", t.color)} />
                        <span className="text-xs text-muted-foreground font-medium">{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">Định dạng tiền tệ</p>
                  <div className="flex flex-col gap-2 max-w-xs">
                    {["1.000.000 ₫ (Mặc định)", "1,000,000 VND", "VND 1,000,000"].map((fmt, i) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all">
                        <input type="radio" name="currency_fmt" defaultChecked={i === 0}
                          className="accent-primary w-4 h-4" />
                        <span className="text-sm text-foreground font-medium">{fmt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">Ngôn ngữ</p>
                  <div className="flex gap-2 flex-wrap">
                    {["Tiếng Việt", "English"].map((lang, i) => (
                      <button key={i} className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                        i === 0
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      )}>
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}

function Field({ icon: Icon, label, value, onChange, placeholder, type = "text", required }: {
  icon: typeof User; label: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  type?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50 transition-all"
        />
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, defaultValue }: { label: string; desc: string; defaultValue: boolean }) {
  const [on, setOn] = useState(defaultValue);
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <button onClick={() => setOn(v => !v)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0",
          on ? "bg-primary" : "bg-muted"
        )}>
        <span className={cn(
          "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
          on && "translate-x-5"
        )} />
      </button>
    </div>
  );
}
