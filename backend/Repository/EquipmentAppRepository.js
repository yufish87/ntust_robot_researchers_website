/**
 * Repository for Equipment Applications
 * Sheet: 'EquipmentApplications'
 */
var EquipmentAppRepository = (function() {
    var SHEET_NAME = 'EquipmentApplications';
    
    // Schema Mapping (0-based index)
    // [申請單號(key), 申請者學號, 姓名, 借用原因, 借用器材清單JSON, 借用器材摘要, 分配器材編號JSON, 方便領取時間, 借用起始日, 預計歸還日, 借出狀態, 審核者學號, 拒絕理由, 通知時間, 申請時間, 審核時間]
    var COL = {
        ID: 0,
        STUDENT_ID: 1,
        NAME: 2,
        REASON: 3,
        ITEMS_JSON: 4,
        SUMMARY: 5,
        ALLOCATED_IDS_JSON: 6,
        PICKUP_DATE: 7, // 方便領取時間 (user input text or date)
        START_DATE: 8, // Usually same as pickup or actual borrow date
        RETURN_DATE: 9,
        STATUS: 10,
        REVIEWER: 11,
        REJECT_REASON: 12,
        NOTIFY_TIME: 13,
        CREATED_AT: 14,
        REVIEWED_AT: 15
    };

    /**
     * Create a new application
     * @param {Object} appData
     * @returns {string} applicationId
     */
    function create(appData) {
        var db = SheetDB.getDB();
        var sheet = db.getSheetByName(SHEET_NAME);
        
        // Generate ID: EQAPP + Timestamp + Random
        var id = "EQAPP" + new Date().getTime();
        var now = new Date();

        // Prepare row
        var row = [];
        row[COL.ID] = id;
        row[COL.STUDENT_ID] = appData.studentId;
        row[COL.NAME] = appData.name;
        row[COL.REASON] = appData.reason;
        row[COL.ITEMS_JSON] = JSON.stringify(appData.items || []);
        row[COL.SUMMARY] = appData.summary || "";
        row[COL.ALLOCATED_IDS_JSON] = "[]"; // Initial empty
        row[COL.PICKUP_DATE] = appData.pickupDate || "";
        row[COL.START_DATE] = ""; // Set when approved/borrowed? Or same as pickup? Leave empty for now.
        row[COL.RETURN_DATE] = appData.returnDate;
        row[COL.STATUS] = "待審核";
        row[COL.REVIEWER] = "";
        row[COL.REJECT_REASON] = "";
        row[COL.NOTIFY_TIME] = "";
        row[COL.CREATED_AT] = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
        row[COL.REVIEWED_AT] = "";

        sheet.appendRow(row);
        return id;
    }

    /**
     * Find applications by Student ID
     * @param {string} studentId
     * @returns {Array} List of applications
     */
    function findByStudentId(studentId) {
        var db = SheetDB.getDB();
        var sheet = db.getSheetByName(SHEET_NAME);
        var data = sheet.getDataRange().getValues();
        var results = [];

        // Skip header
        for (var i = 1; i < data.length; i++) {
            if (data[i][COL.STUDENT_ID] === studentId) {
                results.push(_mapRowToModel(data[i]));
            }
        }
        return results;
    }

    function _mapRowToModel(row) {
        var items = [];
        try {
            items = JSON.parse(row[COL.ITEMS_JSON]);
        } catch (e) {}

        return {
            id: row[COL.ID],
            studentId: row[COL.STUDENT_ID],
            name: row[COL.NAME],
            reason: row[COL.REASON],
            items: items,
            summary: row[COL.SUMMARY],
            pickupDate: row[COL.PICKUP_DATE],
            returnDate: row[COL.RETURN_DATE],
            status: row[COL.STATUS],
            createdAt: row[COL.CREATED_AT]
            // Add others if needed
        };
    }

    return {
        create: create,
        findByStudentId: findByStudentId
    };
})();
