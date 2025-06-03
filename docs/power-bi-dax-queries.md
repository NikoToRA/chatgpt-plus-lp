# Power BI DAX クエリ集

このドキュメントには、お問い合わせデータ分析のための一般的なDAXクエリとメジャーが含まれています。

## 基本的なメジャー

### 1. カウントと集計

```dax
// お問い合わせ総数
Total_Inquiries = COUNTROWS('Inquiries')

// ユニーク顧客数
Unique_Customers = DISTINCTCOUNT('Inquiries'[Email])

// 今月のお問い合わせ数
Current_Month_Inquiries = 
CALCULATE(
    [Total_Inquiries],
    MONTH('Inquiries'[SubmittedAt]) = MONTH(TODAY()),
    YEAR('Inquiries'[SubmittedAt]) = YEAR(TODAY())
)

// 先月のお問い合わせ数
Last_Month_Inquiries = 
CALCULATE(
    [Total_Inquiries],
    DATEADD('Inquiries'[SubmittedAt], -1, MONTH)
)
```

### 2. 時系列分析

```dax
// 日別平均お問い合わせ数
Daily_Average = 
AVERAGEX(
    VALUES('Date'[Date]),
    CALCULATE([Total_Inquiries])
)

// 累積お問い合わせ数
Cumulative_Inquiries = 
CALCULATE(
    [Total_Inquiries],
    FILTER(
        ALL('Date'[Date]),
        'Date'[Date] <= MAX('Date'[Date])
    )
)

// 前年同期比
YoY_Growth = 
VAR CurrentPeriod = [Total_Inquiries]
VAR LastYearPeriod = CALCULATE([Total_Inquiries], SAMEPERIODLASTYEAR('Date'[Date]))
RETURN
DIVIDE(CurrentPeriod - LastYearPeriod, LastYearPeriod, 0)
```

### 3. ステータス別分析

```dax
// 未対応件数
Pending_Count = 
CALCULATE(
    [Total_Inquiries],
    'Inquiries'[Status] = "Pending"
)

// 完了率
Completion_Rate = 
VAR CompletedCount = CALCULATE([Total_Inquiries], 'Inquiries'[Status] = "Completed")
RETURN
DIVIDE(CompletedCount, [Total_Inquiries], 0)

// 平均処理時間（時間単位）
Avg_Processing_Hours = 
AVERAGEX(
    FILTER('Inquiries', 'Inquiries'[Status] = "Completed"),
    'Inquiries'[ProcessingTime] / 60
)
```

### 4. カテゴリ別分析

```dax
// カテゴリ別シェア
Category_Share = 
DIVIDE(
    CALCULATE([Total_Inquiries]),
    CALCULATE([Total_Inquiries], ALL('Inquiries'[Category])),
    0
)

// トップカテゴリ
Top_Category = 
FIRSTNONBLANK(
    TOPN(1, VALUES('Inquiries'[Category]), [Total_Inquiries]),
    1
)

// カテゴリ別成長率
Category_Growth_Rate = 
VAR CurrentPeriod = [Total_Inquiries]
VAR PreviousPeriod = CALCULATE([Total_Inquiries], PREVIOUSMONTH('Date'[Date]))
RETURN
DIVIDE(CurrentPeriod - PreviousPeriod, PreviousPeriod, 0)
```

## 高度な分析

### 5. トレンド分析

```dax
// 移動平均（7日間）
Moving_Average_7D = 
CALCULATE(
    AVERAGE('Inquiries'[Daily_Count]),
    DATESINPERIOD('Date'[Date], LASTDATE('Date'[Date]), -7, DAY)
)

// トレンドライン（線形回帰）
Trend_Line = 
VAR Known_X = 
    FILTER(
        SELECTCOLUMNS(
            'Date',
            "X", 'Date'[DateKey],
            "Y", [Total_Inquiries]
        ),
        NOT(ISBLANK([Y]))
    )
VAR Count_Items = COUNTROWS(Known_X)
VAR Sum_X = SUMX(Known_X, [X])
VAR Sum_Y = SUMX(Known_X, [Y])
VAR Sum_XY = SUMX(Known_X, [X] * [Y])
VAR Sum_X2 = SUMX(Known_X, [X] * [X])
VAR Slope = DIVIDE(Count_Items * Sum_XY - Sum_X * Sum_Y, Count_Items * Sum_X2 - Sum_X * Sum_X)
VAR Intercept = DIVIDE(Sum_Y - Slope * Sum_X, Count_Items)
RETURN
Slope * MAX('Date'[DateKey]) + Intercept
```

### 6. 顧客分析

```dax
// リピート顧客率
Repeat_Customer_Rate = 
VAR RepeatCustomers = 
    COUNTROWS(
        FILTER(
            SUMMARIZE('Inquiries', 'Inquiries'[Email], "InquiryCount", [Total_Inquiries]),
            [InquiryCount] > 1
        )
    )
RETURN
DIVIDE(RepeatCustomers, [Unique_Customers], 0)

// 顧客あたり平均お問い合わせ数
Avg_Inquiries_Per_Customer = 
DIVIDE([Total_Inquiries], [Unique_Customers], 0)

// 新規顧客数
New_Customers = 
COUNTROWS(
    FILTER(
        VALUES('Inquiries'[Email]),
        CALCULATE(
            MIN('Inquiries'[SubmittedAt]),
            ALL('Date')
        ) >= MIN('Date'[Date]) &&
        CALCULATE(
            MIN('Inquiries'[SubmittedAt]),
            ALL('Date')
        ) <= MAX('Date'[Date])
    )
)
```

### 7. パフォーマンス指標

```dax
// SLA達成率（24時間以内の対応）
SLA_Achievement_Rate = 
VAR Within_SLA = 
    CALCULATE(
        [Total_Inquiries],
        'Inquiries'[ProcessingTime] <= 1440, // 24時間 = 1440分
        'Inquiries'[Status] = "Completed"
    )
VAR Total_Completed = 
    CALCULATE(
        [Total_Inquiries],
        'Inquiries'[Status] = "Completed"
    )
RETURN
DIVIDE(Within_SLA, Total_Completed, 0)

// 応答時間の分布
Response_Time_Distribution = 
SWITCH(
    TRUE(),
    'Inquiries'[ProcessingTime] <= 60, "1時間以内",
    'Inquiries'[ProcessingTime] <= 240, "4時間以内",
    'Inquiries'[ProcessingTime] <= 480, "8時間以内",
    'Inquiries'[ProcessingTime] <= 1440, "24時間以内",
    "24時間超"
)
```

### 8. 予測分析

```dax
// 次月予測（簡易版）
Next_Month_Forecast = 
VAR Last3Months_Avg = 
    CALCULATE(
        AVERAGE('Monthly_Summary'[Inquiry_Count]),
        DATESINPERIOD('Date'[Date], LASTDATE('Date'[Date]), -3, MONTH)
    )
VAR Growth_Rate = [YoY_Growth]
RETURN
Last3Months_Avg * (1 + Growth_Rate)

// 季節性指数
Seasonality_Index = 
VAR Monthly_Avg = 
    CALCULATE(
        [Total_Inquiries],
        ALLEXCEPT('Date', 'Date'[Month])
    ) / 
    CALCULATE(
        DISTINCTCOUNT('Date'[Year]),
        ALLEXCEPT('Date', 'Date'[Month])
    )
VAR Overall_Avg = 
    CALCULATE(
        [Total_Inquiries],
        ALL('Date')
    ) / 
    CALCULATE(
        DISTINCTCOUNT('Date'[MonthYear]),
        ALL('Date')
    )
RETURN
DIVIDE(Monthly_Avg, Overall_Avg, 1)
```

## カスタムテーブル

### 9. 日付テーブルの作成

```dax
Date_Table = 
VAR MinDate = MIN('Inquiries'[SubmittedAt])
VAR MaxDate = MAX('Inquiries'[SubmittedAt])
RETURN
ADDCOLUMNS(
    CALENDAR(MinDate, MaxDate),
    "Year", YEAR([Date]),
    "Month", MONTH([Date]),
    "MonthName", FORMAT([Date], "MMMM"),
    "Quarter", QUARTER([Date]),
    "WeekDay", WEEKDAY([Date]),
    "WeekDayName", FORMAT([Date], "dddd"),
    "MonthYear", FORMAT([Date], "YYYY-MM"),
    "IsWeekend", IF(WEEKDAY([Date]) IN {1, 7}, TRUE, FALSE)
)
```

### 10. カテゴリ階層テーブル

```dax
Category_Hierarchy = 
DATATABLE(
    "Category", STRING,
    "MainCategory", STRING,
    "SubCategory", STRING,
    {
        {"技術的な質問", "サポート", "技術"},
        {"料金について", "営業", "料金"},
        {"契約について", "営業", "契約"},
        {"不具合報告", "サポート", "バグ"},
        {"機能要望", "製品", "要望"},
        {"その他", "その他", "その他"}
    }
)
```

## 使用上の注意

1. **パフォーマンス**: 大量のデータを扱う場合は、計算列よりもメジャーを使用することを推奨します。
2. **コンテキスト**: フィルターコンテキストを正しく理解し、適切にCALCULATE関数を使用してください。
3. **更新頻度**: リアルタイムに近い分析が必要な場合は、DirectQueryモードの使用を検討してください。
4. **メモリ使用**: 複雑な計算は事前に集計テーブルを作成することで最適化できます。

## トラブルシューティング

### よくあるエラーと対処法

1. **循環参照エラー**
   - 原因: メジャー間の相互参照
   - 解決: 依存関係を明確にし、変数を使用して計算を分離

2. **パフォーマンス低下**
   - 原因: 非効率なDAXクエリ
   - 解決: CALCULATE関数の使用を最小限に抑え、変数を活用

3. **誤った集計結果**
   - 原因: フィルターコンテキストの誤解
   - 解決: ALL、ALLEXCEPT関数を適切に使用してコンテキストを制御