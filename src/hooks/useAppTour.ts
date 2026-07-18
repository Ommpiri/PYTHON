import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useSession } from "@/hooks/useSession";

export function useAppTour(enabled = true) {
  const { user, status } = useSession();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (status === "loading") return; // wait for auth state

    // If they need to onboard, the root router will redirect them. Don't show tour yet.
    if (status === "authenticated" && user && user.onboarding_completed === false) {
      return;
    }

    const tourCompleted = localStorage.getItem("pyc-tour-completed");
    if (tourCompleted) return;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      doneBtnText: "Done",
      nextBtnText: "Next",
      prevBtnText: "Prev",
      popoverClass: "pyc-driver-popover", // Custom styling defined in styles.css
      steps: [
        {
          element: "header",
          popover: {
            title: "Welcome to pycourse!",
            description: "Let's take a quick tour of your new Python development environment.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "#tour-terminal",
          popover: {
            title: "The Terminal",
            description: "Here you can explore the file system, read files, and get a feel for the command-line aesthetic.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "#tour-modules",
          popover: {
            title: "Course Modules",
            description: "These 12 modules take you from basic Python to building complete projects. Progress is saved automatically.",
            side: "top",
            align: "center",
          },
        },
        {
          element: "#tour-certificate",
          popover: {
            title: "Certificate of Completion",
            description: "Finish all modules to unlock and print your certificate.",
            side: "top",
            align: "center",
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem("pyc-tour-completed", "true");
      },
    });

    // Short delay to let the UI render completely
    const timer = setTimeout(() => {
      driverObj.drive();
    }, 500);

    return () => clearTimeout(timer);
  }, [enabled, status, user?.onboarding_completed]);
}
