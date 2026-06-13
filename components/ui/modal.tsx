// components/ui/modal.tsx
// v6.19: 統一されたモーダルコンポーネント
// ConfirmModal, BottomSheet, AlertModalを統合

import { useRef, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  Modal as RNModal, 
  StyleSheet, 
  Animated, 
  Platform,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { color } from "@/theme/tokens";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ==================== 型定義 ====================

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** モーダルのタイプ */
  type?: "center" | "bottom";
  /** 背景タップで閉じるか */
  dismissable?: boolean;
  /** タイトル */
  title?: string;
  /** サブタイトル */
  subtitle?: string;
  /** 閉じるボタンを表示するか */
  showCloseButton?: boolean;
  /** 最大幅（centerモーダル用） */
  maxWidth?: number;
  /** 最大高さ（bottomシート用） */
  maxHeight?: number | `${number}%`;
}

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
}

export interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  type?: "info" | "success" | "warning" | "error";
}

// ==================== Modal ====================

/**
 * 汎用モーダルコンポーネント
 * 
 * @example
 * // センターモーダル
 * <Modal visible={isOpen} onClose={handleClose} title="タイトル">
 *   <Text>コンテンツ</Text>
 * </Modal>
 * 
 * // ボトムシート
 * <Modal visible={isOpen} onClose={handleClose} type="bottom" title="選択">
 *   <Text>コンテンツ</Text>
 * </Modal>
 */
export function Modal({
  visible,
  onClose,
  children,
  type = "center",
  dismissable = true,
  title,
  subtitle,
  showCloseButton = true,
  maxWidth = 400,
  maxHeight = "80%" as `${number}%`,
}: ModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      if (type === "center") {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }),
        ]).start();
      }
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [visible, type, scaleAnim, opacityAnim, slideAnim]);

  const handleBackdropPress = useCallback(() => {
    if (dismissable) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onClose();
    }
  }, [dismissable, onClose]);

  const handleClosePress = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  }, [onClose]);

  const containerStyle = type === "center" 
    ? [
        styles.centerContainer,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          maxWidth,
        },
      ]
    : [
        styles.bottomContainer,
        {
          transform: [{ translateY: slideAnim }],
          maxHeight,
        },
      ];

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <Pressable
          style={[
            styles.overlay,
            type === "bottom" && styles.overlayBottom,
          ]}
          
          onPress={handleBackdropPress}
        >
          <Animated.View style={containerStyle}>
            <Pressable  style={styles.contentWrapper}>
              {/* ヘッダー */}
              {(title || showCloseButton) && (
                <View style={styles.header}>
                  <View style={styles.headerText}>
                    {title && <Text style={styles.title}>{title}</Text>}
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                  </View>
                  {showCloseButton && (
                    <Pressable
                      onPress={handleClosePress}
                      style={styles.closeButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MaterialIcons name="close" size={24} color={color.textMuted} />
                    </Pressable>
                  )}
                </View>
              )}

              {/* ボトムシートのハンドル */}
              {type === "bottom" && (
                <View style={styles.handleContainer}>
                  <View style={styles.handle} />
                </View>
              )}

              {/* コンテンツ */}
              <ScrollView 
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

// ==================== ConfirmModal ====================

/**
 * 確認モーダル
 * 
 * @example
 * <ConfirmModal
 *   visible={showConfirm}
 *   title="削除しますか？"
 *   message="この操作は取り消せません。"
 *   confirmText="削除"
 *   confirmStyle="destructive"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowConfirm(false)}
 * />
 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = "確認",
  cancelText = "キャンセル",
  confirmStyle = "default",
  onConfirm,
  onCancel,
  icon,
  iconColor = color.accentPrimary,
}: ConfirmModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleConfirm = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onConfirm();
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onCancel();
  }, [onCancel]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Pressable
        style={styles.overlay}
        
        onPress={onCancel}
      >
        <Animated.View
          style={[
            styles.confirmContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Pressable >
            {/* アイコン */}
            {icon && (
              <View style={styles.iconContainer}>
                <MaterialIcons name={icon} size={40} color={iconColor} />
              </View>
            )}

            {/* タイトル */}
            <Text style={styles.confirmTitle}>{title}</Text>

            {/* メッセージ */}
            <Text style={styles.confirmMessage}>{message}</Text>

            {/* ボタン */}
            <View style={styles.buttonContainer}>
              <Pressable
                onPress={handleCancel}
                style={[styles.button, styles.cancelButton]}
                
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                style={[
                  styles.button,
                  styles.confirmButton,
                  confirmStyle === "destructive" && styles.destructiveButton,
                ]}
                
              >
                <Text
                  style={[
                    styles.confirmButtonText,
                    confirmStyle === "destructive" && styles.destructiveButtonText,
                  ]}
                >
                  {confirmText}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </RNModal>
  );
}

// ==================== AlertModal ====================

const alertTypeConfig = {
  info: { icon: "info" as const, color: color.info },
  success: { icon: "check-circle" as const, color: color.success },
  warning: { icon: "warning" as const, color: color.warning },
  error: { icon: "error" as const, color: color.danger },
};

/**
 * アラートモーダル（単一ボタン）
 * 
 * @example
 * <AlertModal
 *   visible={showAlert}
 *   title="保存しました"
 *   message="データが正常に保存されました。"
 *   type="success"
 *   onClose={() => setShowAlert(false)}
 * />
 */
export function AlertModal({
  visible,
  title,
  message,
  buttonText = "OK",
  onClose,
  icon,
  iconColor,
  type = "info",
}: AlertModalProps) {
  const typeConfig = alertTypeConfig[type];
  const finalIcon = icon || typeConfig.icon;
  const finalIconColor = iconColor || typeConfig.color;

  return (
    <ConfirmModal
      visible={visible}
      title={title}
      message={message}
      confirmText={buttonText}
      cancelText=""
      onConfirm={onClose}
      onCancel={onClose}
      icon={finalIcon}
      iconColor={finalIconColor}
    />
  );
}

// ==================== スタイル ====================

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: color.overlayDark,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  overlayBottom: {
    justifyContent: "flex-end",
    padding: 0,
  },
  centerContainer: {
    backgroundColor: color.surface,
    borderRadius: 20,
    width: "100%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  bottomContainer: {
    backgroundColor: color.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
    overflow: "hidden",
  },
  contentWrapper: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: color.textWhite,
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    color: color.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    marginTop: -8,
    marginRight: -8,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: color.border,
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 0,
  },
  scrollContentContainer: {
    padding: 20,
  },
  // ConfirmModal styles
  confirmContainer: {
    backgroundColor: color.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 16,
  },
  confirmTitle: {
    color: color.textWhite,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  confirmMessage: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: color.border,
  },
  cancelButtonText: {
    color: color.textWhite,
    fontSize: 15,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: color.info,
  },
  confirmButtonText: {
    color: color.textWhite,
    fontSize: 15,
    fontWeight: "600",
  },
  destructiveButton: {
    backgroundColor: color.danger,
  },
  destructiveButtonText: {
    color: color.textWhite,
  },
});

export default Modal;
