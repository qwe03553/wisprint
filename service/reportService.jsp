<%@ page language="java" pageEncoding="UTF-8"
	contentType="text/html;charset=UTF-8"%>
<%@ page
	import="org.json.*,java.util.*,org.apache.commons.io.*,java.io.File,com.jatools.mireport.*"%>
<%
	response.setHeader("Cache-Control", "no-cache");
	response.setHeader("Pragma", "no-cache");
	response.setDateHeader("Expires", -1);
%>
<%
	// 用于保存设计模板或打开报表模板
	// 1. 无论读或写,都需要知道目标文件
	ServletContext context = pageContext.getServletContext();
	// 从模板文件读入模板数据,为演示方便，模板数据放在templates目录下
	String settingsID = request.getParameter("settingsID");//.toString();
	String json = "";
	String how = request.getParameter("how");
	if (how.equals("upload")) {
		// 写模板，在设计器点击保存时使用
		//console.log("previewParam:"+previewParam);
		String templatetext = request.getParameter("template").toString();
		Map<String, String> params = new HashMap<String, String>();
		// 用户有可能从 iframe.src= r.jsp?xxxx=?.... 中传入想保存的额外参数，故传给 reportmanage.save();
		for (Enumeration en = request.getParameterNames(); en.hasMoreElements();) {
			String name = (String) en.nextElement();
			params.put(name, request.getParameter(name));
		}
		String tid = Config.getInstance().getReportManager().save(settingsID, templatetext, params);
		com.jatools.dddy.Result result = new com.jatools.dddy.Result();
		result.put("tid",tid);
		json =result.toString();
	} else if (how.equals("sessioned")) {
		// 设计器测试打印前调用，放session里就行了
		String templatetext = request.getParameter("template").toString();
		//console.log("templatetext:"+templatetext)
		String sessionedid = SessionedReportCache.set(request.getSession(), templatetext);
		//console.log("sessionedid:"+sessionedid)
		Config.getInstance().getReportManager().save("debug", templatetext, null);
		json = String.format("{\"sessionedreport\":\"%s\"}", sessionedid);
	} else if (how.equals("copy")) {
		// 设计器测试打印前调用，放session里就行了
		String from =  request.getParameter("from").toString();
		String to =  request.getParameter("to").toString();
		boolean overwrite = !("false".equals(request.getParameter("overwrite")));
		boolean success = Config.getInstance().getReportManager().copy(from, to, overwrite);
		json = String.format("{\"success\":%s}",success+"");	
	}else if (how.equals("export")) {
		String sessionedreport = request.getParameter("sessionedreport").toString();
		String report = SessionedReportCache.getSessionedReport(request.getSession(), sessionedreport);
		byte[] reportbytes = report.getBytes("UTF-8");
		response.setContentType("application/octet-stream");
		response.setHeader("Content-length", Integer.toString(reportbytes.length));
		response.setHeader("Content-Disposition", "attachment; filename=wisprint.json");
		response.getOutputStream().write(reportbytes, 0, reportbytes.length);
		response.getOutputStream().flush();	

	}  else {
		// 下载报表模板
		Report report = Config.getInstance().getReportManager().load(settingsID);
		if (report != null) {
			json = report.toString();
		} else
			json = "{\"error\":\"no report\"}";		
	}
%>
<%=json%>