import React from "react";
import { Button } from "./ui/button";
import { Save, Undo, Redo, HelpCircle, Menu, ArrowUpRight, User, LogOut } from "lucide-react";
import logo from "../../assets/icons/logo.png";

export const Navbar = ({ onSave, title = "" }) => {
  return (
    <div className="bg-white border-b border-gray-200 py-2 px-4 flex justify-between items-center shadow-sm h-14">
      <div className="flex items-center gap-3">
        <button className="p-2 text-gray-500 hover:text-gray-700 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
          <span className="font-semibold text-lg hidden sm:inline text-gray-700">{title}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div 
          className="flex items-center gap-1 text-gray-500 hover:text-[#10b981] transition-colors cursor-pointer"
          onClick={onSave}
        >
          <Save className="h-5 w-5" />
          <span className="text-sm">저장</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500 hover:text-[#10b981] transition-colors cursor-pointer">
          <Undo className="h-5 w-5" />
          <span className="text-sm">이전</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500 hover:text-[#10b981] transition-colors cursor-pointer">
          <Redo className="h-5 w-5" />
          <span className="text-sm">다음</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500 hover:text-[#10b981] transition-colors cursor-pointer">
          <HelpCircle className="h-5 w-5" />
          <span className="text-sm">도움말</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button 
          variant="default" 
          size="sm" 
          className="text-white font-medium bg-[#10b981] hover:bg-[#0ea271] h-10 px-6"
        >
          <span>컨버팅</span>
          <ArrowUpRight className="h-4 w-4 ml-1" />
        </Button>
        <Button 
          variant="ghost" 
          size="default"
          className="text-[#10b981] hover:bg-[#e6f7f1] h-10 px-4 flex items-center gap-1"
        >
          <LogOut className="h-4 w-4" />
          <span>로그아웃</span>
        </Button>
        <Button 
          variant="default" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-[#10b981] hover:bg-[#0ea271]"
          title="프로필"
        >
          <User className="h-4 w-4 text-white" />
        </Button>
      </div>
    </div>
  );
};