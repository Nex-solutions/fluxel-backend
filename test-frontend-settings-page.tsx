import React, { useState, useEffect } from "react";
import Switch from "@/components/ui/switch";
import { LuChevronRight } from "react-icons/lu";
import useMediaQuery from "@/hooks/media-query";
import PaymentMethod from "../payment-method";

// ::::::::::::::::::::::::: Settings Section Props
interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

// ::::::::::::::::::::::::: Settings Section
function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div className="sm:rounded-lg sm:border sm:border-solid sm:border-dash-border sm:bg-dash-bg2 sm:p-[1.375rem]">
      <h2 className="mb-1 text-lg text-white sm:text-[1.375rem]">{title}</h2>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

// ::::::::::::::::::::::::: Settings Row Props
interface SettingsRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

// ::::::::::::::::::::::::: Settings Row
function SettingsRow({ label, children, className = "" }: SettingsRowProps) {
  return (
    <div className="flex h-[4.0625rem] items-center justify-between">
      <span className={`text-xsm text-gray-300 sm:text-sm ${className}`}>
        {label}
      </span>
      {children}
    </div>
  );
}

interface Settings {
  toggleSettings: {
    enableAdExpiration: boolean;
    enable2fa: boolean;
    googleAuthenticator: boolean;
    appLock: boolean;
    popup: boolean;
    promotionalEmail: boolean;
    eventPush: boolean;
    messages: boolean;
    trades: boolean;
  };
  inputSettings: {
    kycStatus: string;
    emailVerification: string;
    phoneVerification: string;
    withdrawalPassword: string;
    systemNotification: string;
    language: string;
    currency: string;
  };
}

// ::::::::::::::::::::::::: Main Settings Page
export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    toggleSettings: {
      enableAdExpiration: false,
      enable2fa: false,
      googleAuthenticator: false,
      appLock: false,
      popup: false,
      promotionalEmail: false,
      eventPush: false,
      messages: false,
      trades: false,
    },
    inputSettings: {
      kycStatus: "Verified",
      emailVerification: "nnam*******90@gmail.com",
      phoneVerification: "814****910",
      withdrawalPassword: "On",
      systemNotification: "On",
      language: "English",
      currency: "NGN",
    }
  });

  const [activeTab, setActiveTab] = useState(1);
  const durations = ["6 Hours", "12 Hours", "24 Hours", "7 Days", "30 Days"];
  const [currentDuration, setCurrentDuration] = useState("24 Hours");
  const [preferredCurrency, setPreferredCurrency] = useState("NGN");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/user/settings");
      const data = await response.json();

      // Dummy response handling
      if (response.ok) {
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const handleToggleChange = async (setting: keyof typeof settings.toggleSettings) => {
    const newSettings = {
      ...settings,
      toggleSettings: {
        ...settings.toggleSettings,
        [setting]: !settings.toggleSettings[setting]
      }
    };

    setSettings(newSettings);

    try {
      const response = await fetch("/api/user/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newSettings)
      });

      if (!response.ok) {
        // Revert changes if save failed
        setSettings(settings);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      // Revert changes if save failed
      setSettings(settings);
    }
  };

  // ::::::::::::::::::::::::: Breakpoints
  const sm = useMediaQuery("(max-width: 640px)");

  return (
    <div className="w-full max-w-[42.3438rem] space-y-6">
      {/* ::::::::::::::::::::::::: Verification - LV Tab */}
      <div className="flex h-[2.625rem] w-full items-center rounded bg-black px-4">
        <div className="flex w-full justify-between space-x-4">
          <button
            className={`text-xsm sm:text-sm ${activeTab === 1 ? "text-white" : "text-dash-dim2"
              }`}
            onClick={() => setActiveTab(1)}
          >
            Verification
          </button>
          <button
            className={`text-xsm sm:text-sm ${activeTab === 2 ? "text-white" : "text-dash-dim2"
              }`}
            onClick={() => setActiveTab(2)}
          >
            LV Verified
          </button>
        </div>
      </div>

      {/* ::::::::::::::::::::::::: Security Settings */}
      <SettingsSection title="Security Settings">
        <div className="mb-1 flex items-center gap-[0.625rem] border-0 border-b border-solid border-green-500 pb-2">
          <p className="text-xsm text-dash-dim2 sm:text-sm">Security Level</p>
          <span className="text-xsm text-green-500 sm:text-sm">High</span>
        </div>

        <SettingsRow
          className="max-sm:!text-base"
          label="Enable 2FA for each log in"
        >
          <Switch
            checked={settings.toggleSettings.enable2fa}
            onChange={() => handleToggleChange("enable2fa")}
            variant={sm ? "small" : "medium"}
          />
        </SettingsRow>

        <SettingsRow className="max-sm:!text-base" label="Google Authenticator">
          <Switch
            checked={settings.toggleSettings.googleAuthenticator}
            onChange={() => handleToggleChange("googleAuthenticator")}
            variant={sm ? "small" : "medium"}
          />
        </SettingsRow>

        <SettingsRow label="KYC">
          <span className="text-sm capitalize text-secondary-cta">
            {settings.inputSettings.kycStatus}
          </span>
        </SettingsRow>

        <SettingsRow label="Email Verification">
          <span className="text-sm text-dash-dim2">
            {settings.inputSettings.emailVerification}
          </span>
        </SettingsRow>

        <SettingsRow label="Phone Verification">
          <span className="text-sm text-dash-dim2">
            {settings.inputSettings.phoneVerification}
          </span>
        </SettingsRow>

        <SettingsRow label="Withdrawal Password">
          <span className="text-sm text-dash-dim2">
            {settings.inputSettings.withdrawalPassword}
          </span>
        </SettingsRow>

        <SettingsRow label="App Lock">
          <Switch
            checked={settings.toggleSettings.appLock}
            onChange={() => handleToggleChange("appLock")}
            variant={sm ? "small" : "medium"}
          />
        </SettingsRow>

        <SettingsRow label="Reset Passcode">
          <button className="text-sm text-dash-dim2 hover:text-secondary-cta">
            Reset
          </button>
        </SettingsRow>
      </SettingsSection>

      {/* ::::::::::::::::::::::::: Trade Configurations */}
      <SettingsSection title="Trade Configurations">
        <SettingsRow
          className="max-sm:!text-base"
          label="Enable automatic Ad expiration"
        >
          <Switch
            checked={settings.toggleSettings.enableAdExpiration}
            onChange={() => handleToggleChange("enableAdExpiration")}
            variant={sm ? "small" : "medium"}
          />
        </SettingsRow>

        <SettingsRow label="Set default Ad expiry duration">
          <div className="flex max-w-[17rem] flex-wrap justify-center gap-2">
            {durations.map((duration, i) => (
              <button
                key={i}
                className={`ease-300 flex h-[2rem] w-[5rem] items-center justify-center rounded border border-solid text-sm active:scale-95 ${duration === currentDuration
                  ? "border-secondary-cta bg-secondary-cta/20 text-secondary-cta"
                  : "border-transparent text-dash-dim2 hover:bg-gray-500/10"
                  }`}
                onClick={() => setCurrentDuration(duration)}
              >
                {duration}
              </button>
            ))}
          </div>
        </SettingsRow>
      </SettingsSection>

      {/* ::::::::::::::::::::::::: Payment Methods */}
      <SettingsSection title="Payment Methods">
        <PaymentMethod />
      </SettingsSection>

      {/* ::::::::::::::::::::::::: Notification Settings */}
      <SettingsSection title="Notification Settings">
        <SettingsRow label="Pop up">
          <Switch
            checked={settings.toggleSettings.popup}
            onChange={() => handleToggleChange("popup")}
            variant={sm ? "small" : "medium"}
          />
        </SettingsRow>

        <SettingsRow label="Promotional Email">
          <Switch
            checked={settings.toggleSettings.promotionalEmail}
            onChange={() => handleToggleChange("promotionalEmail")}
            variant={sm ? "small" : "medium"}
          />
        </SettingsRow>

        <SettingsRow label="System Notification">
          <span className="text-sm text-dash-dim2">
            {settings.inputSettings.systemNotification}
          </span>
        </SettingsRow>

        <SettingsRow label="Event Push">
          <Switch
            checked={settings.toggleSettings.eventPush}
            onChange={() => handleToggleChange("eventPush")}
            variant={sm ? "small" : "medium"}
          />
        </SettingsRow>

        <SettingsRow label="Messages">
          <Switch
            checked={settings.toggleSettings.messages}
            onChange={() => handleToggleChange("messages")}
            variant={sm ? "small" : "medium"}
          />
        </SettingsRow>

        <SettingsRow label="Trades">
          <Switch
            checked={settings.toggleSettings.trades}
            onChange={() => handleToggleChange("trades")}
            variant={sm ? "small" : "medium"}
          />
        </SettingsRow>
      </SettingsSection>

      {/* ::::::::::::::::::::::::: Preferred Currency */}
      <SettingsSection title="Preferred Currency">
        <div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setPreferredCurrency("NGN")}
              className={`ease-300 flex h-[2.5rem] w-[6.25rem] items-center justify-center rounded border border-solid text-sm ${preferredCurrency === "NGN" ? "border-secondary-cta bg-secondary-cta/10 text-secondary-cta" : "border-dash-border bg-gray-500/10 text-white active:scale-95"}`}
            >
              NGN
            </button>
            <button
              onClick={() => setPreferredCurrency("USD")}
              className={`ease-300 flex h-[2.5rem] w-[6.25rem] items-center justify-center rounded border border-solid text-sm ${preferredCurrency === "USD" ? "border-secondary-cta bg-secondary-cta/10 text-secondary-cta" : "border-dash-border bg-gray-500/10 text-white active:scale-95"}`}
            >
              USD
            </button>
          </div>

          <div className="flex w-full items-center justify-between text-white">
            <span className="text-sm">Show currency</span>
            <div className="flex items-center text-dash-dim2">
              <span>{preferredCurrency}</span>
              <LuChevronRight className="-ml-1 text-[1.25rem]" />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* ::::::::::::::::::::::::: Preferences */}
      <SettingsSection title="Preferences">
        <SettingsRow label="Language">
          <button className="flex items-center gap-0.5 text-sm text-dash-dim2 hover:text-secondary-cta">
            {settings.inputSettings.language}
            <LuChevronRight className="h-4 w-4" />
          </button>
        </SettingsRow>

        <SettingsRow label="Show currency">
          <button className="flex items-center gap-0.5 text-sm text-dash-dim2 hover:text-secondary-cta">
            {settings.inputSettings.currency}
            <LuChevronRight className="h-4 w-4" />
          </button>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
