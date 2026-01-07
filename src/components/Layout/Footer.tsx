import { Link } from "react-router-dom";

export function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-white py-12">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 md:grid-cols-4">
                <div className="col-span-1 md:col-span-2">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="EventSphere logo" className="h-8 w-8" />
                        <span className="text-lg font-bold text-slate-900">EventSphere</span>
                    </Link>
                    <p className="mt-4 max-w-sm text-sm text-slate-500">
                        The premier platform for discovering and organizing campus events. Connect, Create, and Celebrate with us.
                    </p>
                    <p className="mt-6 text-xs text-slate-400">
                        &copy; {new Date().getFullYear()} EventSphere. All rights reserved.
                    </p>
                </div>

                <div>
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">Platform</h3>
                    <ul className="space-y-3 text-sm text-slate-600">
                        <li>
                            <Link to="/" className="hover:text-brand-blue">Browse Events</Link>
                        </li>
                        <li>
                            <Link to="/organizer" className="hover:text-brand-blue">Organize</Link>
                        </li>
                        <li>
                            <Link to="/auth" className="hover:text-brand-blue">Sign In</Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">Legal</h3>
                    <ul className="space-y-3 text-sm text-slate-600">
                        <li>
                            <a href="#" className="hover:text-brand-blue">Privacy Policy</a>
                        </li>
                        <li>
                            <a href="#" className="hover:text-brand-blue">Terms of Service</a>
                        </li>
                        <li>
                            <a href="#" className="hover:text-brand-blue">Cookie Policy</a>
                        </li>
                    </ul>
                </div>
            </div>
        </footer>
    );
}
