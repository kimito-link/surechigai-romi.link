/**
 * useModalState Hook
 * モーダルの表示状態管理
 */

import { useState } from "react";
import type { SelectedRegion, FanProfile, FilterState, GenderFilter } from "../types";

interface UseModalStateReturn {
  // Prefecture modal
  selectedPrefectureForModal: string | null;
  setSelectedPrefectureForModal: (value: string | null) => void;
  
  // Region modal
  selectedRegion: SelectedRegion | null;
  setSelectedRegion: (value: SelectedRegion | null) => void;
  
  // Host profile modal
  showHostProfileModal: boolean;
  setShowHostProfileModal: (value: boolean) => void;
  
  // Fan profile modal
  selectedFan: FanProfile | null;
  setSelectedFan: (value: FanProfile | null) => void;
  
  // Filter state
  selectedPrefectureFilter: string;
  setSelectedPrefectureFilter: (value: string) => void;
  showPrefectureFilterList: boolean;
  setShowPrefectureFilterList: (value: boolean) => void;
  selectedGenderFilter: GenderFilter;
  setSelectedGenderFilter: (value: GenderFilter) => void;
}

export function useModalState(): UseModalStateReturn {
  // Prefecture modal
  const [selectedPrefectureForModal, setSelectedPrefectureForModal] = useState<string | null>(null);
  
  // Region modal
  const [selectedRegion, setSelectedRegion] = useState<SelectedRegion | null>(null);
  
  // Host profile modal
  const [showHostProfileModal, setShowHostProfileModal] = useState(false);
  
  // Fan profile modal
  const [selectedFan, setSelectedFan] = useState<FanProfile | null>(null);
  
  // Filter state
  const [selectedPrefectureFilter, setSelectedPrefectureFilter] = useState("all");
  const [showPrefectureFilterList, setShowPrefectureFilterList] = useState(false);
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<GenderFilter>("all");
  
  return {
    // Prefecture modal
    selectedPrefectureForModal,
    setSelectedPrefectureForModal,
    
    // Region modal
    selectedRegion,
    setSelectedRegion,
    
    // Host profile modal
    showHostProfileModal,
    setShowHostProfileModal,
    
    // Fan profile modal
    selectedFan,
    setSelectedFan,
    
    // Filter state
    selectedPrefectureFilter,
    setSelectedPrefectureFilter,
    showPrefectureFilterList,
    setShowPrefectureFilterList,
    selectedGenderFilter,
    setSelectedGenderFilter,
  };
}
